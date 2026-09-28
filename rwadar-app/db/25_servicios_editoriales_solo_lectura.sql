-- RWAdar: corte editorial gratuito autorizado el 27/09/2026.
-- No borra filas ni cuentas. Mantiene catálogo público y acceso administrativo.
-- La reapertura de servicios de usuario requiere otra migración explícita.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon, authenticated;

-- REVOKE a nivel de tabla no revoca los privilegios concedidos por columna.
do $$
declare obj record; cols text;
begin
  for obj in select c.oid,c.relname from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','v')
  loop
    select string_agg(quote_ident(attname),',') into cols from pg_attribute
      where attrelid=obj.oid and attnum>0 and not attisdropped;
    if cols is not null then
      execute format('revoke insert (%s), update (%s), references (%s) on public.%I from anon, authenticated',cols,cols,cols,obj.relname);
      if obj.relname in ('perfiles','vigilancia','dispositivos','seguimiento',
        'opiniones','denuncias','moderacion','avisos_correo','avisos_push',
        'mi_perfil','mis_opiniones','opiniones_publicas','nota_media',
        'cola_moderacion','avisos_pendientes','avisos_correo_pendientes') then
        execute format('revoke all on public.%I from public, anon, authenticated',obj.relname);
        execute format('revoke select (%s) on public.%I from public, anon, authenticated',cols,obj.relname);
      end if;
    end if;
  end loop;
  for obj in select p.oid::regprocedure as firma from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
      and p.proname in ('borrar_mi_cuenta','borrar_mi_opinion','guardar_opinion',
        'denunciar_opinion','moderar','es_admin','es_opinion_propia','instalacion_actual')
  loop
    execute format('revoke all on function %s from public, anon, authenticated',obj.firma);
  end loop;
end $$;

revoke all on function rwadar_catalogo.es_array_json(jsonb),
  rwadar_catalogo.es_array_texto_https(jsonb) from public, anon, authenticated;

notify pgrst, 'reload schema';
