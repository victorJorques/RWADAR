-- =====================================================================
-- RWAdar 31 · leer de Vault el remitente de los avisos (solo lee)
-- ---------------------------------------------------------------------
-- Lo ejecuta rwadar-app/correo-lettermint.sh (acción prueba-correo del
-- flujo «Correo Lettermint», .github/workflows/correo-lettermint.yml)
-- cuando no se escribe el remitente a mano:
--
--   psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 \
--     -f rwadar-app/db/31_correo_lettermint_remitente.sql
--
-- Devuelve una sola línea: RWADAR_REMITENTE tal como lo leerá
-- enviar_correos() (31_correo_lettermint.sql), o nada si no está o hay más
-- de uno con ese nombre. Es la dirección desde la que salen los avisos: no
-- es secreta. No lee el token (LETTERMINT_API_TOKEN) ni ningún otro secreto.
-- Transacción de solo lectura que se deshace al final: no cambia nada.
-- =====================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin transaction read only;
set local statement_timeout = '30s';

select case when count(*) = 1 then btrim(max(s.decrypted_secret)) end as remitente
  from vault.decrypted_secrets s
 where s.name = 'RWADAR_REMITENTE';

rollback;
