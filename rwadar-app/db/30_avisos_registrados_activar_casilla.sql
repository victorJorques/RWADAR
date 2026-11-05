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
-- Fija `casilla_activada_el`. Solo cuenta el permiso de un alta cuyo correo
-- de confirmación salió desde ese momento (`confirmation_sent_at` de Auth):
-- un alta anterior recibió el correo antiguo, sin el aviso, y confirmarla
-- después no la apunta (puede apuntarse en Perfil). Si la casilla ya estaba
-- activa, se conserva la fecha.
--
-- Hay que REPETIRLO tras fallo_cerrado.sql o tras reaplicar
-- 30_avisos_registrados.sql si la web o la app siguen enseñando la casilla:
-- los dos la apagan. 30_avisos_registrados_apagar.sql no la toca.
--
-- No envía nada, no crea reloj y no enciende el correo ni el push. Después:
-- el verificador 30 («casilla del alta activa»). Marcha atrás, al retirar la
-- plantilla: 30_avisos_registrados_apagar_casilla.sql.
-- =====================================================================
begin;

do $precondiciones$
begin
  if (select count(*) from pg_attribute
       where attrelid = to_regclass('rwadar_novedades.configuracion')
         and attname in ('casilla_activa', 'casilla_activada_el') and not attisdropped) <> 2 then
    raise exception using errcode = '55000',
      message = 'avisos 30: falta aplicar la versión actual de 30_avisos_registrados.sql';
  end if;
end
$precondiciones$;

update rwadar_novedades.configuracion
   set casilla_activada_el = case when casilla_activa and casilla_activada_el is not null
                                  then casilla_activada_el else now() end,
       casilla_activa = true
 where unica;

commit;
