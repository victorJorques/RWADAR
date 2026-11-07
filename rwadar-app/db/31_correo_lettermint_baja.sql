-- =====================================================================
-- RWAdar 31 · aplicar en RWAdar una baja guardada en Lettermint
-- ---------------------------------------------------------------------
-- La ruta de difusión de Lettermint (la de los anuncios) añade su propio
-- enlace de baja y guarda esas bajas en su lista de supresiones. Una baja
-- que solo está allí deja la cuenta apuntada en RWAdar: le siguen llegando
-- los push de novedades (RUNBOOK, «Bajas guardadas en Lettermint»).
--
-- Lo ejecuta rwadar-app/correo-lettermint.sh (acción sincronizar-bajas del
-- flujo «Correo Lettermint»), una vez por cada correo que Lettermint tiene
-- suprimido por «unsubscribe» en una ruta de difusión:
--
--   psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 \
--     -v correo="$CORREO" -v suprimido_el="$FECHA" \
--     -f rwadar-app/db/31_correo_lettermint_baja.sql
--
-- correo       = la dirección suprimida (Lettermint: «value»).
-- suprimido_el = cuándo se guardó la baja allí (Lettermint: «created_at»,
--                ISO 8601).
--
-- Devuelve una sola palabra, sin datos de nadie:
--   aplicada    la cuenta seguía apuntada con un permiso ANTERIOR a la baja
--               de Lettermint (o aún no tenía preferencias):
--               rwadar_novedades.baja_por_correo la da de baja
--               (novedades = false, baja_el y la fila baja/correo).
--   ya_de_baja  ya estaba de baja en RWAdar: no se toca. Así, repetir la
--               sincronización no llena el historial ni cambia baja_el.
--   reapuntada  la cuenta volvió a apuntarse en RWAdar DESPUÉS de la baja de
--               Lettermint: manda el permiso nuevo y no se toca. (Lettermint
--               le seguirá bloqueando los anuncios por correo mientras su
--               baja siga allí; quitarla es cosa del panel de Lettermint.)
--   sin_cuenta  ninguna cuenta de RWAdar tiene ese correo.
--
-- El correo solo va como literal (:'correo', que psql escapa) en un SELECT:
-- nunca en una DDL (Supabase registra las del rol postgres con su texto) ni
-- en un mensaje. Una sola transacción.
-- =====================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin;
set local statement_timeout = '30s';

with entrada as (
  select lower(btrim(:'correo')) as correo, (:'suprimido_el')::timestamptz as suprimido_el
), cuentas as (
  select p.usuario_id is not null as con_preferencias, coalesce(p.novedades, false) as apuntada,
         p.aceptado_el
    from entrada e
    join auth.users u on lower(btrim(u.email)) = e.correo
    left join rwadar_novedades.preferencias p on p.usuario_id = u.id
), decision as (
  select case
           when e.correo = '' or not exists (select 1 from cuentas) then 'sin_cuenta'
           when exists (select 1 from cuentas c
                         where not c.con_preferencias
                            or (c.apuntada and (c.aceptado_el is null or c.aceptado_el < e.suprimido_el)))
             then 'aplicar'
           when exists (select 1 from cuentas c where c.apuntada) then 'reapuntada'
           else 'ya_de_baja'
         end as d,
         e.correo
    from entrada e
)
select case
         when d <> 'aplicar' then d
         when rwadar_novedades.baja_por_correo(correo) then 'aplicada'
         else 'sin_cuenta'
       end as resultado
  from decision;

commit;
