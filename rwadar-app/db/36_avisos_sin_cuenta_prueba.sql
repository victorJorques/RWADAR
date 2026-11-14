-- =====================================================================
-- RWAdar 36 · lo que respondió la prueba sin cuenta
-- ---------------------------------------------------------------------
-- Lo ejecuta .github/workflows/avisos-base.yml (acción prueba-sin-cuenta),
-- unos segundos después de pedir la prueba con
-- rwadar_novedades.sin_cuenta_prueba() (solo sale con 5 suscripciones sin
-- cuenta o menos):
--
--   psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 \
--     -v peticiones="$PETICIONES" \
--     -f rwadar-app/db/36_avisos_sin_cuenta_prueba.sql
--
-- peticiones = lo que devolvió sin_cuenta_prueba(): [[petición, número,
-- canal], …] (solo números; canal 1 = web, 2 = móvil). Se usa solo como
-- literal (:'peticiones', que psql escapa). Escribe una línea separada por
-- «|»: envíos, esperando respuesta, enviados (aceptados), suscripciones
-- caducadas (404/410 o DeviceNotRegistered, borradas), fallidos, fallos del
-- servidor de la web o de Expo, códigos y códigos del servidor. Nunca
-- direcciones, tokens, claves ni cargas.
-- =====================================================================
\set ON_ERROR_STOP on
select r ->> 'envios', r ->> 'esperando', r ->> 'enviados', r ->> 'caducadas', r ->> 'fallidos',
       r ->> 'servidor', r ->> 'codigos', r ->> 'codigos_servidor'
  from rwadar_novedades.sin_cuenta_prueba_resultado(:'peticiones'::jsonb) as r;
