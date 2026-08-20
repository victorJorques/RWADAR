-- =====================================================================
-- RWAdar · ACL de helpers y search_path fijo
-- ---------------------------------------------------------------------
-- Corrección mínima de los hallazgos confirmados en producción:
--   * cuatro funciones trigger conservaban EXECUTE predeterminado;
--   * tres funciones heredadas tenían search_path mutable.
--
-- No cambia datos, tablas, políticas ni permisos de las RPC deliberadas.
-- Es transaccional, idempotente y no depende de 13_envio_avisos.sql.
-- =====================================================================
begin;

-- Los triggers siguen ejecutando estas funciones como parte de la
-- operación que los dispara; el rol cliente no necesita EXECUTE directo.
revoke all on function crea_perfil()
  from public, anon, authenticated;
revoke all on function encola_avisos_correo()
  from public, anon, authenticated;
revoke all on function revisa_denuncias()
  from public, anon, authenticated;
revoke all on function sincroniza_autor_opiniones()
  from public, anon, authenticated;

-- Fija la resolución de objetos sin reemplazar el cuerpo ni recrear las
-- funciones, de modo que sus triggers y propietario permanecen intactos.
alter function toca_actualizada_el()
  set search_path = public, pg_temp;
alter function registra_cambio_estado()
  set search_path = public, pg_temp;
alter function instalacion_actual()
  set search_path = public, pg_temp;

-- PostgREST invalida su catálogo de funciones al confirmar la transacción.
notify pgrst, 'reload schema';
commit;
