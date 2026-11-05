-- =====================================================================
-- RWAdar · «Avisar novedad» (lo ejecuta .github/workflows/avisar-novedad.yml)
-- ---------------------------------------------------------------------
-- Uso, siempre con orden expresa de Víctor:
--
--   psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \
--     -v accion="$ACCION" -v tipo="$TIPO" -v titulo="$TITULO" \
--     -v texto="$TEXTO" -v enlace="$ENLACE" -v id="$ID" \
--     -f rwadar-app/db/anunciar.sql
--
-- accion = anunciar           → crea un anuncio `actualizacion` o `novedad`
--                               ya publicado (rwadar_novedades.anunciar).
-- accion = publicar-retenido  → publica el anuncio retenido `id`
--                               (rwadar_novedades.publicar_anuncio).
--
-- Las entradas llegan como variables de psql y se usan SOLO como literales
-- (`:'variable'`, que psql escapa): nunca se pegan en el SQL. psql no
-- sustituye variables dentro de un bloque `do $…$`, así que pasan por una
-- tabla temporal. Una sola transacción: un fallo no deja nada.
--
-- El anuncio aparece en la app al momento; el correo y el push salen solo si
-- están encendidos (30_avisos_registrados_activar_*.sql) y solo a quien se
-- apuntó. La clave (tipo:fecha:huella) impide repetir el mismo aviso el
-- mismo día si el flujo se lanza dos veces.
-- =====================================================================
\set ON_ERROR_STOP on
begin;

create temporary table avisar_entrada on commit drop as
  select :'accion'::text as accion,
         :'tipo'::text as tipo,
         :'titulo'::text as titulo,
         :'texto'::text as texto,
         :'enlace'::text as enlace,
         :'id'::text as id;

do $flujo$
declare
  e record;
  v_id bigint;
begin
  select * into e from pg_temp.avisar_entrada;
  if e.accion = 'anunciar' then
    v_id := rwadar_novedades.anunciar(
      e.tipo,
      e.tipo || ':' || to_char(current_date, 'YYYY-MM-DD') || ':'
        || left(md5(coalesce(e.titulo, '') || E'\n' || coalesce(e.texto, '') || E'\n'
                    || coalesce(e.enlace, '')), 12),
      e.titulo, e.texto, e.enlace);
    raise notice 'Anuncio % publicado. El correo y el push salen solo si están encendidos.', v_id;
  elsif e.accion = 'publicar-retenido' then
    if e.id is null or e.id !~ '^[1-9][0-9]{0,17}$' then
      raise exception using errcode = '22023', message = 'id de anuncio no válido';
    end if;
    if rwadar_novedades.publicar_anuncio(e.id::bigint) then
      raise notice 'Anuncio % publicado.', e.id;
    else
      raise notice 'El anuncio % ya estaba publicado: no cambia nada.', e.id;
    end if;
  else
    raise exception using errcode = '22023', message = 'acción no válida: anunciar o publicar-retenido';
  end if;
end
$flujo$;

-- Lo que queda, para el registro del flujo (sin datos personales).
select id, tipo, estado, titulo, enlace, creado_el, publicado_el
  from rwadar_novedades.anuncios
 order by id desc
 limit 3;

commit;
