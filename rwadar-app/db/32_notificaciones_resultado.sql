-- =====================================================================
-- RWAdar 32 · guardar lo que respondió cada servicio de push
-- ---------------------------------------------------------------------
-- Lo ejecuta .github/workflows/notificaciones-web.yml después de cada tanda:
--
--   psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 \
--     -v resultados="$(cat resultados.json)" \
--     -f rwadar-app/db/32_notificaciones_resultado.sql
--
-- resultados = lo que escribe rwadar-app/enviar-webpush.mjs:
-- [{"id":"e12","codigo":201}, …] (sin endpoints, claves ni cargas). Se usa
-- solo como literal (:'resultados', que psql escapa). Escribe una línea con
-- las cuentas, separadas por «|»: enviados, reintentar, fallidos, borradas
-- (suscripciones caducadas) e ignorados.
-- =====================================================================
\set ON_ERROR_STOP on
select r ->> 'enviados', r ->> 'reintentar', r ->> 'fallidos', r ->> 'borradas', r ->> 'ignorados'
  from rwadar_novedades.webpush_resultado(:'resultados'::jsonb) as r;
