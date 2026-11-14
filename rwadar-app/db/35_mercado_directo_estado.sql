-- =====================================================================
-- RWAdar 35 · estado del gráfico en directo (solo lee, sin secretos)
-- Encendido, relojes, esperas, el documento (hora y edad, puntos, fuera,
-- largos y cubos sin lectura de cada serie), las 12 últimas llamadas a
-- CoinGecko, los 429 de los últimos 7 días, las llamadas del mes y lo que
-- ocupa cada tabla.
-- =====================================================================
begin transaction read only;

select 'encendido' as que, encendido::text as valor from rwadar_mercado.configuracion where unica
union all select 'relojes', coalesce(string_agg(jobname || ' [' || schedule || ']', ', ' order by jobname), 'ninguno')
  from cron.job where jobname like 'rwadar-mercado-%'
union all select 'tokens de la diaria', cardinality(tokens)::text || ' (diaria de ' || coalesce(to_char(diaria_generado at time zone 'UTC', 'YYYY-MM-DD HH24:MI'), '—')
  || ' UTC, leída ' || coalesce(to_char(diaria_leida_el at time zone 'UTC', 'YYYY-MM-DD HH24:MI'), 'nunca') || ' UTC)' from rwadar_mercado.configuracion where unica
union all select 'siembra', coalesce(to_char(sembrado_el at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC, historia hasta '
  || to_char(sembrado_hasta at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC', 'sin siembra') from rwadar_mercado.configuracion where unica
union all select 'espera tras fallos', coalesce('hasta ' || to_char(reintentar_desde at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC', 'ninguna')
  || ' (fallos seguidos ' || fallos_seguidos || ', 429 seguidos ' || seguidos_429 || ')' from rwadar_mercado.configuracion where unica
union all select 'llamadas a CoinGecko del mes', coalesce(to_char(mes, 'YYYY-MM'), '—') || ': ' || llamadas_mes from rwadar_mercado.configuracion where unica
union all select 'documento', coalesce((select 'de ' || to_char(generado at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') || ' UTC, hace '
  || round(extract(epoch from now() - generado) / 60, 1) || ' min' from rwadar_mercado.directo where unica), 'sin documento')
union all select 'serie ' || s.clave,
  coalesce(jsonb_array_length(d.doc->'series'->s.clave->'valores')::text || ' puntos desde ' || (d.doc->'series'->s.clave->>'desde')
    || '; fuera ' || (d.doc->'series'->s.clave->>'fuera') || '; largos ' || (d.doc->'series'->s.clave->>'largos')
    || '; sin lectura del directo ' || (d.doc->'series'->s.clave->>'sinLectura'), 'no sale')
  from rwadar_mercado.directo d cross join (values ('5m'), ('1h')) s(clave)
union all select 'llamadas de 7 días', count(*)::text || ' (' || count(*) filter (where estado = 200) || ' con 200, '
  || count(*) filter (where estado = 429) || ' con 429, ' || count(*) filter (where estado is not null and estado not in (200, 429)) || ' con otro fallo)'
  from rwadar_mercado.registro where pedido_el > now() - interval '7 days'
union all select 'tabla ' || c.relname, n_live_tup::text || ' filas, ' || pg_size_pretty(pg_total_relation_size(c.oid))
  from pg_class c join pg_namespace n on n.oid = c.relnamespace left join pg_stat_user_tables s on s.relid = c.oid
 where n.nspname = 'rwadar_mercado' and c.relkind = 'r';

select to_char(pedido_el at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') as pedido_utc, estado, bytes, validos, guardados, error, prueba
  from rwadar_mercado.registro order by pedido_el desc limit 12;

rollback;
