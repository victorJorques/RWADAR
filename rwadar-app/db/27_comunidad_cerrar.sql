-- =====================================================================
-- RWAdar 27 · marcha atrás de la comunidad (no borra nada)
-- ---------------------------------------------------------------------
-- Retira la lectura pública y las funciones de publicar, denunciar y
-- moderar. Las publicaciones y denuncias se conservan para poder atender
-- reclamaciones o volver a abrir con 27_comunidad.sql.
-- =====================================================================
begin;
revoke all on public.publicaciones, public.denuncias_publicaciones from public, anon, authenticated;
revoke all on public.cupos_publicacion from public, anon, authenticated;
do $privadas$
begin
  if exists(select 1 from pg_namespace where nspname='rwadar_comunidad_privada') then
    revoke all on all functions in schema rwadar_comunidad_privada from public,anon,authenticated;
    revoke all on schema rwadar_comunidad_privada from public,anon,authenticated;
  end if;
end
$privadas$;
do $cerrar$
declare f regprocedure;
begin
  foreach f in array array['public.publicar(text,boolean)', 'public.mis_publicaciones()',
    'public.borrar_mi_publicacion(uuid)', 'public.denunciar_publicacion(uuid,text)',
    'public.moderar_publicacion(uuid,text)', 'public.cola_publicaciones()']::regprocedure[] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end
$cerrar$;
notify pgrst, 'reload schema';
commit;
