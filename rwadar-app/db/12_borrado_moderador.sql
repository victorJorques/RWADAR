-- =====================================================================
-- RWAdar · arregla el borrado de cuenta de quien ha moderado
-- ---------------------------------------------------------------------
-- QUÉ PASABA
--
-- `moderacion.moderador_id` estaba declarada así:
--
--     moderador_id uuid not null references auth.users(id) on delete set null
--
-- Las dos mitades se contradicen: al borrar el usuario, la clave ajena
-- intenta poner NULL y la restricción `not null` lo impide. Resultado:
-- **quien haya moderado una sola vez no puede borrar su cuenta nunca.**
-- La llamada falla con 23502 y la persona se queda atrapada.
--
-- No es un detalle: la política de privacidad publicada promete que se
-- puede borrar la cuenta cuando se quiera, y el RGPD lo exige. Un
-- administrador es una persona igual que las demás.
--
-- Se descubrió al intentar borrar una cuenta de prueba que había
-- restaurado una opinión.
--
-- CÓMO SE ARREGLA
--
-- La columna pasa a admitir nulos. El historial de moderación NO se
-- borra —hace falta para poder responder a una reclamación— pero pierde
-- el nombre de quien decidió, que es exactamente lo que debe ocurrir
-- cuando alguien ejerce su derecho de supresión: queda que se ocultó,
-- cuándo y por qué, sin quién.
--
-- Depende de 10_moderacion.sql.  Es idempotente.
-- =====================================================================
begin;

alter table moderacion alter column moderador_id drop not null;

comment on column moderacion.moderador_id is
  'Quién decidió. Queda a NULL si esa persona borra su cuenta: el registro de la decisión sobrevive, la identidad no.';

commit;
