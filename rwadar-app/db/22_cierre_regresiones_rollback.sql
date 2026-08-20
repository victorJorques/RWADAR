-- =====================================================================
-- RWAdar · rollback operativo SEGURO de la migración 22
-- ---------------------------------------------------------------------
-- No restaura ningún grant vulnerable. Ante un problema en 22, deja las
-- opiniones en lectura, detiene moderación/push y conserva las colas y
-- todos los datos. Reaplicar 22 recupera la API, pero el push continúa
-- apagado hasta ejecutar de nuevo su flujo opt-in validado.
-- =====================================================================
begin;

revoke execute on function public.guardar_opinion(uuid, integer, text)
  from authenticated;
revoke execute on function public.borrar_mi_opinion(uuid)
  from authenticated;
revoke execute on function public.denunciar_opinion(uuid, text)
  from authenticated;
revoke execute on function public.moderar(uuid, text, text)
  from authenticated;

revoke insert, update, delete on table public.opiniones, public.denuncias
  from anon, authenticated;
revoke update on table public.perfiles from anon, authenticated;
grant update (nombre, avisos_correo) on public.perfiles to authenticated;

revoke all on function public.push_soltar(integer)
  from public, anon, authenticated;
revoke all on function public.push_confirmar()
  from public, anon, authenticated;
revoke all on function public.push_ciclo()
  from public, anon, authenticated;
update public.push_configuracion
   set habilitado = false, activado_el = null, activado_por = null
 where singleton;
update public.avisos_push
   set token = null, intentos = 5,
       error = 'Rollback 22; push desactivado',
       peticion_id = null, peticion_el = null
 where enviado_el is null and intentos < 5;
select cron.unschedule('rwadar-push')
 where exists (select 1 from cron.job where jobname = 'rwadar-push');

notify pgrst, 'reload schema';
commit;
