-- =====================================================================
-- RWAdar 30 · ACTIVAR la casilla de avisos del alta (casilla_activa)
-- ---------------------------------------------------------------------
-- Paso 4 de la activación (contrato, «Activación»), solo con permiso expreso
-- de Víctor, y en este orden:
--   1. plantilla «Confirm signup» de Supabase Auth puesta
--      (plantillas-auth/confirmar-alta.html), con su párrafo de avisos;
--   2. este script;
--   3. AVISOS_NOVEDADES_REMOTOS = true en la web y la app, privacidad al
--      día, publicar la web y enviar la OTA.
--
-- Hasta aquí, el disparador de confirmación ni lee los metadatos del alta:
-- nadie queda apuntado por escribir `avisos_novedades` a mano en un alta
-- antes de que la plantilla avise de ello. Las cuentas confirmadas antes de
-- este paso no cambian (sus preferencias ya existen): se apuntan en Perfil.
--
-- No envía nada, no crea reloj y no enciende el correo ni el push. Después:
-- el verificador 30 («casilla del alta activa»). Marcha atrás:
-- 30_avisos_registrados_apagar.sql (o fallo_cerrado.sql), que la apagan.
-- =====================================================================
begin;

do $precondiciones$
begin
  if not exists (select 1 from pg_attribute
                  where attrelid = to_regclass('rwadar_novedades.configuracion')
                    and attname = 'casilla_activa' and not attisdropped) then
    raise exception using errcode = '55000',
      message = 'avisos 30: falta aplicar la versión actual de 30_avisos_registrados.sql';
  end if;
end
$precondiciones$;

update rwadar_novedades.configuracion set casilla_activa = true where unica;

commit;
