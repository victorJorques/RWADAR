-- PREPARADO LOCALMENTE. No aplicado en producción. Requiere aprobación específica.
-- No modifica filas, punteros, retirado ni fechas del catálogo.
-- Conserva los permisos SELECT previos de PUBLIC/anon/authenticated para rollback.
begin;
select pg_advisory_xact_lock(20261023, 28);
create schema if not exists rwadar_acceso_privado;
revoke all on schema rwadar_acceso_privado from public, anon, authenticated;
create table if not exists rwadar_acceso_privado.catalogo_acl_20261023 (
  relacion text primary key, oid_original oid not null, tipo "char" not null,
  rls boolean not null, opciones text[], permisos jsonb not null, aplicado boolean not null default false
);
revoke all on rwadar_acceso_privado.catalogo_acl_20261023 from public, anon, authenticated;

do $aplicar$
declare
  nombre text; objeto record; fila record; columna record; rol text; snapshot jsonb;
  relaciones constant text[] := array[
    'rwadar_catalogo.revisiones','rwadar_catalogo.fuentes','rwadar_catalogo.plataformas',
    'rwadar_catalogo.plataforma_fuentes','rwadar_catalogo.alertas','rwadar_catalogo.alerta_fuentes',
    'rwadar_catalogo.ofertas','rwadar_catalogo.publicacion_v2',
    'public.catalogo_publicacion','public.categorias','public.regiones','public.plataformas',
    'public.fuentes','public.cambios_estado','public.emisiones',
    'rwadar_catalogo.revision_publicable','rwadar_catalogo.revision_publicable_v2',
    'public.catalogo_plataformas_publicas','public.catalogo_ofertas_publicas',
    'public.catalogo_plataformas_publicas_v2','public.catalogo_ofertas_publicas_v2',
    'public.radar_publico','public.emisiones_publicas','public.emisiones_rancias'
  ];
begin
  if to_regprocedure('rwadar_cuentas_privadas.sesion_confirmada()') is null then
    raise exception 'Falta el contrato de sesión confirmada existente. No se crea un sustituto.';
  end if;
  foreach nombre in array relaciones loop
    select c.oid,c.relkind,c.relrowsecurity,c.reloptions,c.relacl,c.relowner into objeto
      from pg_class c where c.oid=to_regclass(nombre);
    if not found or objeto.relkind not in ('r','v') then raise exception 'Inventario inesperado: %', nombre; end if;
    if objeto.relowner in (select oid from pg_roles where rolname in ('anon','authenticated')) then
      raise exception 'Un rol cliente es propietario de %', nombre;
    end if;
    select * into fila from rwadar_acceso_privado.catalogo_acl_20261023 where relacion=nombre;
    if found then
      if fila.oid_original<>objeto.oid or fila.tipo<>objeto.relkind then raise exception 'Cambió el objeto %', nombre; end if;
      if not fila.aplicado then raise exception 'Rollback previo: crear una revisión nueva antes de reaplicar'; end if;
    else
      if exists(select 1 from pg_policy where polrelid=objeto.oid and polname='catalogo_cuenta_confirmada') then
        raise exception 'Política homónima ajena al plan en %', nombre;
      end if;
      select coalesce(jsonb_agg(jsonb_build_object('columna',x.columna,'rol',x.grantee,
          'opcion',x.is_grantable)), '[]'::jsonb) into snapshot from (
        select null::text columna,a.grantee,a.is_grantable
          from aclexplode(case when cardinality(objeto.relacl)>0 then objeto.relacl else acldefault('r',objeto.relowner) end) a
          where a.privilege_type='SELECT'
        union all
        select at.attname,a.grantee,a.is_grantable from pg_attribute at
          cross join lateral aclexplode(case when cardinality(at.attacl)>0 then at.attacl else null::aclitem[] end) a
          where at.attrelid=objeto.oid and at.attnum>0 and not at.attisdropped and a.privilege_type='SELECT'
      ) x where x.grantee=0 or x.grantee in (select oid from pg_roles where rolname in ('anon','authenticated'));
      insert into rwadar_acceso_privado.catalogo_acl_20261023
        (relacion,oid_original,tipo,rls,opciones,permisos)
        values(nombre,objeto.oid,objeto.relkind,objeto.relrowsecurity,objeto.reloptions,snapshot);
    end if;
    execute format('revoke select on table %s from public, anon', nombre);
    for columna in select attname from pg_attribute where attrelid=objeto.oid and attnum>0 and not attisdropped loop
      execute format('revoke select (%I) on table %s from public, anon',columna.attname,nombre);
    end loop;
    -- Do not widen authenticated privileges. Required grants must already exist.
    if not has_table_privilege('authenticated',objeto.oid,'SELECT') then
      raise exception 'Falta SELECT previo de authenticated en %; no se amplían privilegios',nombre;
    end if;
    if objeto.relkind='v' then
      execute format('alter view %s set (security_invoker=true)',nombre);
    else
      execute format('alter table %s enable row level security',nombre);
      if not exists(select 1 from pg_policy where polrelid=objeto.oid and polname='catalogo_cuenta_confirmada') then
        execute format('create policy catalogo_cuenta_confirmada on %s as restrictive for select to authenticated using ((select rwadar_cuentas_privadas.sesion_confirmada()))',nombre);
      end if;
    end if;
    -- Also catches inherited grants that REVOKE on the named roles cannot remove.
    if has_table_privilege('anon',objeto.oid,'SELECT') or exists(
      select 1 from pg_attribute where attrelid=objeto.oid and attnum>0 and not attisdropped
        and has_column_privilege('anon',objeto.oid,attnum,'SELECT')) then
      raise exception 'anon conserva SELECT heredado en %; resolver explícitamente',nombre;
    end if;
    update rwadar_acceso_privado.catalogo_acl_20261023 set aplicado=true where relacion=nombre;
  end loop;
end
$aplicar$;
commit;
