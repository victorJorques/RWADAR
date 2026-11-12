-- =====================================================================
-- RWAdar 33 · lo que respondió la prueba de notificaciones web desde
-- Supabase (solo cuentas de administración)
-- ---------------------------------------------------------------------
-- Lo ejecuta .github/workflows/avisos-base.yml (acción prueba-webpush),
-- unos segundos después de encolar la prueba con
-- rwadar_novedades.webpush_prueba_supabase():
--
--   psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 \
--     -v peticiones="$PETICIONES" \
--     -f rwadar-app/db/33_webpush_supabase_prueba.sql
--
-- peticiones = lo que devolvió webpush_prueba_supabase():
-- [[petición, suscripción], …] (solo números). Se usa solo como literal
-- (:'peticiones', que psql escapa). Escribe una línea separada por «|»:
-- envíos, esperando respuesta, enviados (aceptados por el servicio de
-- push), suscripciones caducadas (404/410, borradas), fallidos, fallos del
-- servidor de la web, códigos de los servicios de push y códigos del
-- servidor. Nunca endpoints, claves ni cargas.
-- =====================================================================
\set ON_ERROR_STOP on
select r ->> 'envios', r ->> 'esperando', r ->> 'enviados', r ->> 'caducadas', r ->> 'fallidos',
       r ->> 'servidor', r ->> 'codigos', r ->> 'codigos_servidor'
  from rwadar_novedades.webpush_prueba_supabase_resultado(:'peticiones'::jsonb) as r;
