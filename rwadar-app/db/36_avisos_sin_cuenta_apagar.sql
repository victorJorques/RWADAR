-- =====================================================================
-- RWAdar 36 · APAGAR las notificaciones sin cuenta
-- ---------------------------------------------------------------------
-- Corta las altas nuevas y los envíos sin cuenta (acción apagar-sin-cuenta,
-- con copia antes y escribiendo AVISOS). La baja sigue funcionando siempre.
-- No borra filas, no toca el push de las cuentas, ni relojes, ni Vault: lo
-- ya pedido se sigue leyendo en procesar() y la limpieza (90 días, 180 días
-- y 3 años) sigue cada día. Al volver a encender, solo salen los anuncios
-- publicados después. Para quitarlo también de la web y de la app, sus
-- interruptores (AVISOS_SIN_CUENTA del servidor, de la web y de la app).
-- =====================================================================
begin;

do $apagar$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null
     and exists (select 1 from pg_attribute
                  where attrelid = to_regclass('rwadar_novedades.configuracion')
                    and attname = 'sin_cuenta_activa' and not attisdropped) then
    update rwadar_novedades.configuracion
       set sin_cuenta_activa = false, sin_cuenta_activada_el = null
     where unica;
  end if;
end
$apagar$;

commit;
