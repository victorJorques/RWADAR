-- =====================================================================
-- RWAdar 30 · APAGAR la casilla de avisos del alta (casilla_activa)
-- ---------------------------------------------------------------------
-- Solo para RETIRAR la casilla: cuando se quita el párrafo de avisos de la
-- plantilla «Confirm signup» de Supabase Auth. Con permiso expreso de
-- Víctor y en este orden:
--   1. AVISOS_NOVEDADES_REMOTOS = false en la web y la app, publicar la web
--      y enviar la OTA: la casilla deja de enseñarse (si se sigue
--      enseñando, marcarla ya no guardaría nada);
--   2. este script: desde ahora, los metadatos del alta no dan permiso;
--   3. la plantilla anterior en Auth (plantillas-auth/LEEME.md).
--
-- Para dejar de ENVIAR avisos no hace falta: eso es
-- 30_avisos_registrados_apagar.sql, que no toca la casilla. Este script no
-- toca el correo, el push, los anuncios ni los relojes, y no borra filas:
-- los permisos ya guardados siguen valiendo (se dan de baja en Perfil o con
-- el enlace de cada aviso).
--
-- Después: el verificador 30 («casilla del alta inactiva»). Volver a
-- encenderla: 30_avisos_registrados_activar_casilla.sql, con fecha nueva.
-- =====================================================================
begin;

do $apagar_casilla$
begin
  if to_regclass('rwadar_novedades.configuracion') is null then
    return;
  end if;
  if exists (select 1 from pg_attribute
              where attrelid = to_regclass('rwadar_novedades.configuracion')
                and attname = 'casilla_activa' and not attisdropped) then
    execute 'update rwadar_novedades.configuracion set casilla_activa = false where unica';
  end if;
  if exists (select 1 from pg_attribute
              where attrelid = to_regclass('rwadar_novedades.configuracion')
                and attname = 'casilla_activada_el' and not attisdropped) then
    execute 'update rwadar_novedades.configuracion set casilla_activada_el = null where unica';
  end if;
end
$apagar_casilla$;

commit;
