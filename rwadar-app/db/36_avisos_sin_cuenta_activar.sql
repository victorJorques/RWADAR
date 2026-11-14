-- =====================================================================
-- RWAdar 36 · ENCENDER las notificaciones sin cuenta
-- ---------------------------------------------------------------------
-- Solo con orden expresa de Víctor (acción activar-sin-cuenta de «Avisos a
-- registrados (base)», con copia antes y escribiendo AVISOS). Antes: la 36
-- aplicada (ensayo-36, aplicar-36 y verificar-36), el push encendido
-- (activar-push) y la clave VAPID creada (crear-vapid). Después: el
-- verificador 36, activarlas en un iPhone (con la web en la pantalla de
-- inicio) y en un Android, y prueba-sin-cuenta.
--
-- Desde aquí, la web y la app pueden dar de alta navegadores y móviles sin
-- cuenta (avisos_sin_cuenta_texto dice activo) y procesar() les manda los
-- anuncios publicados DESPUÉS de este momento: nada viejo sale de golpe.
-- Transaccional: si falta algo, no queda encendido. Volver a lanzarlo con
-- todo encendido no cambia la fecha de activación.
-- Apagar: 36_avisos_sin_cuenta_apagar.sql (o fallo_cerrado.sql).
-- =====================================================================
begin;

do $precondiciones$
declare
  v_cfg record;
  v_privada text;
  v_secretos integer;
begin
  if to_regclass('rwadar_novedades.sin_cuenta_web') is null
     or to_regprocedure('rwadar_novedades.sin_cuenta_enviar_webpush(integer)') is null
     or to_regprocedure('public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)') is null then
    raise exception using errcode = '55000', message = 'sin cuenta: falta aplicar 36_avisos_sin_cuenta.sql';
  end if;
  if position('rwadar_novedades.sin_cuenta_enviar_webpush()' in
              pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure)) = 0
     or position('rwadar_novedades.sin_cuenta_enviar_push()' in
                 pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure)) = 0
     or position('rwadar_novedades.sin_cuenta_limpiar()' in
                 pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure)) = 0 then
    raise exception using errcode = '55000',
      message = 'sin cuenta: procesar() o limpiar() no llevan lo de sin cuenta (¿se reaplicó la 30, la 32 o la 33? reaplicar la 36)';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if not coalesce(v_cfg.push_habilitado and v_cfg.push_activado_el is not null, false)
     or not exists (select 1 from cron.job
                     where jobname = 'rwadar-novedades' and active
                       and lower(command) like '%rwadar_novedades.procesar()%') then
    raise exception using errcode = '55000',
      message = 'sin cuenta: el push está apagado o falta el reloj rwadar-novedades (activar-push antes)';
  end if;
  select count(*), btrim(max(s.decrypted_secret)) into v_secretos, v_privada
    from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if coalesce(v_cfg.webpush_clave_publica, '') !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$'
     or v_secretos <> 1 or coalesce(v_privada, '') !~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$' then
    raise exception using errcode = '55000',
      message = 'sin cuenta: falta la clave VAPID o no es válida (crear-vapid antes)';
  end if;
  if v_cfg.sin_cuenta_version is null or v_cfg.sin_cuenta_texto_es is null or v_cfg.sin_cuenta_texto_en is null then
    raise exception using errcode = '55000', message = 'sin cuenta: faltan la versión o los textos del permiso (reaplicar la 36)';
  end if;
end
$precondiciones$;

update rwadar_novedades.configuracion
   set sin_cuenta_activada_el = case when sin_cuenta_activa and sin_cuenta_activada_el is not null
                                     then sin_cuenta_activada_el else clock_timestamp() end,
       sin_cuenta_activa = true
 where unica;

commit;
