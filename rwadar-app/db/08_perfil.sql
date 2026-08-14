-- =====================================================================
-- RWAdar · lo que el perfil necesita para funcionar solo
-- ---------------------------------------------------------------------
--   1 · borrar la cuenta sin pedirle permiso a nadie
--   2 · saber desde cuándo eres miembro y cuánto has usado esto
--
-- Lo primero no es un capricho: la política de privacidad publicada
-- promete que puedes borrarla desde tu propio perfil. Sin esta función,
-- el navegador no puede tocar auth.users y la promesa sería falsa.
--
-- Depende de 07_cuentas.sql.  Es idempotente.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · Borrado de la propia cuenta
-- ---------------------------------------------------------------------
-- security definer porque auth.users pertenece al esquema de Supabase y
-- un usuario normal no puede borrar ahí. El riesgo evidente —que alguien
-- borre la cuenta de otro— se cierra con auth.uid(): la función NO acepta
-- parámetros, así que solo puede borrar a quien la llama.
--
-- El resto (perfil, vigilancia, avisos) se va solo por las cascadas que
-- ya declara 07_cuentas.sql. Aquí no hay que borrar nada más a mano.
create or replace function borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = public, auth as $$
declare quien uuid := auth.uid();
begin
  if quien is null then
    raise exception 'hay que haber iniciado sesion';
  end if;
  delete from auth.users where id = quien;
end $$;

revoke all on function borrar_mi_cuenta() from public, anon;
grant execute on function borrar_mi_cuenta() to authenticated;

-- ---------------------------------------------------------------------
-- 2 · Resumen del perfil
-- ---------------------------------------------------------------------
-- Lo que se enseña en el área de la persona. Va en una vista y no en
-- consultas sueltas para que la interfaz no tenga que saber contar.
create or replace view mi_perfil as
  select p.id,
         p.nombre,
         p.avisos_correo,
         p.creado_el                                        as miembro_desde,
         (current_date - p.creado_el::date)                 as dias_de_miembro,
         (select count(*) from vigilancia v where v.usuario_id = p.id)    as plataformas_vigiladas,
         (select count(*) from avisos_correo a where a.usuario_id = p.id) as avisos_recibidos
    from perfiles p
   where p.id = auth.uid();

grant select on mi_perfil to authenticated;

commit;
