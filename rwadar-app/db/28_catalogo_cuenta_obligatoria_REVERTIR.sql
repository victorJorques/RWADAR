-- REVERSIÓN LOCAL PREPARADA. Ejecutarla también requiere autorización específica.
-- Restaura permisos SELECT efectivos y grant options de los tres roles, sin tocar filas.
begin;
select pg_advisory_xact_lock(20261023, 28);
do $revertir$
declare fila record; permiso jsonb; columna record; rol text; previo text;
begin
  if to_regclass('rwadar_acceso_privado.catalogo_acl_20261023') is null then
    raise exception 'No existe la copia ACL de esta operación';
  end if;
  for fila in select * from rwadar_acceso_privado.catalogo_acl_20261023 where aplicado order by relacion loop
    if to_regclass(fila.relacion)::oid is distinct from fila.oid_original then
      raise exception 'Cambió el objeto %: revisión manual antes de revertir',fila.relacion;
    end if;
    execute format('revoke select on table %s from public, anon, authenticated',fila.relacion);
    for columna in select attname from pg_attribute where attrelid=fila.oid_original and attnum>0 and not attisdropped loop
      execute format('revoke select (%I) on table %s from public, anon, authenticated',columna.attname,fila.relacion);
    end loop;
    for permiso in select value from jsonb_array_elements(fila.permisos) loop
      rol := case when (permiso->>'rol')::oid=0 then 'public'
        else quote_ident((select rolname from pg_roles where oid=(permiso->>'rol')::oid)) end;
      if rol is null then raise exception 'Desapareció un rol de la copia ACL'; end if;
      execute format('grant select%s on table %s to %s%s',
        case when permiso->>'columna' is null then '' else format(' (%I)',permiso->>'columna') end,
        fila.relacion,rol,case when (permiso->>'opcion')::boolean then ' with grant option' else '' end);
    end loop;
    if fila.tipo='r' then
      execute format('drop policy if exists catalogo_cuenta_confirmada on %s',fila.relacion);
      if not fila.rls then execute format('alter table %s disable row level security',fila.relacion); end if;
    else
      select split_part(opcion,'=',2) into previo from unnest(coalesce(fila.opciones,'{}'::text[])) opcion
        where split_part(opcion,'=',1)='security_invoker';
      if previo is null then execute format('alter view %s reset (security_invoker)',fila.relacion);
      else execute format('alter view %s set (security_invoker=%L)',fila.relacion,previo); end if;
    end if;
    update rwadar_acceso_privado.catalogo_acl_20261023 set aplicado=false where relacion=fila.relacion;
  end loop;
end
$revertir$;
commit;
