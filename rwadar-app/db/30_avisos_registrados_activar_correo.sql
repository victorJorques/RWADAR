-- =====================================================================
-- RWAdar 30 · ENCENDER el correo de los avisos (Lettermint, desde la 31)
-- ---------------------------------------------------------------------
-- Solo con permiso expreso de Víctor y después de (contrato, «Activación»):
-- dominio propio verificado en Lettermint, el contrato de encargo aceptado y
-- archivado y el seguimiento de aperturas y clics desactivado en el proyecto
-- (la 31 lo pide además en cada correo); la 31 aplicada
-- (31_correo_lettermint.sql: sin ella el envío seguiría siendo el de Brevo,
-- descartado en la revisión legal) y LETTERMINT_API_TOKEN y RWADAR_REMITENTE
-- en Vault (acción guardar-correo del flujo «Avisos a registrados (base)»).
-- Después: los verificadores 30 y 31 y una prueba con una cuenta propia (sin
-- píxel, enlaces directos, la dirección postal en el pie y la baja de
-- principio a fin).
--
-- Transaccional: si falta algo no queda ni el interruptor encendido ni el
-- reloj. Lo encolado antes de encender se descarta: nada sale de golpe.
-- Apagar: 30_avisos_registrados_apagar.sql (o fallo_cerrado.sql). El reloj
-- diario de limpieza (rwadar-novedades-limpieza) lo crea la 30 y no se toca.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.configuracion') is null then
    raise exception using errcode = '55000', message = 'avisos 30: falta aplicar 30_avisos_registrados.sql';
  end if;
  if to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'net' and p.proname = 'http_post')
     or to_regclass('cron.job') is null then
    raise exception using errcode = '55000', message = 'avisos 30: faltan pg_net, pg_cron o Vault';
  end if;
end
$precondiciones$;

-- La 31 tiene que estar aplicada (y no deshecha por reaplicar la 30): el
-- envío llama a Lettermint y ninguna función del correo habla con Brevo.
do $lettermint$
declare
  v_enviar text;
  v_leer text;
  v_mensaje text;
begin
  v_enviar := coalesce(pg_get_functiondef(to_regprocedure('rwadar_novedades.enviar_correos(integer)')), '');
  v_leer := coalesce(pg_get_functiondef(to_regprocedure('rwadar_novedades.leer_correos()')), '');
  v_mensaje := coalesce(pg_get_functiondef(
    to_regprocedure('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)')), '');
  if position('https://api.lettermint.co/v1/send' in v_enviar) = 0
     or position('message_id' in v_leer) = 0
     or position('46600 Alzira' in v_mensaje) = 0
     or lower(v_enviar || v_leer || v_mensaje) like '%brevo%' then
    raise exception using errcode = '55000',
      message = 'avisos 30: falta aplicar 31_correo_lettermint.sql (o se reaplicó la 30 después: vuelve a aplicar la 31)';
  end if;
end
$lettermint$;

-- Los secretos se comprueban sin devolver sus valores: solo su forma.
do $vault$
declare
  v_token text;
  v_remitente text;
begin
  select btrim(max(decrypted_secret) filter (where name = 'LETTERMINT_API_TOKEN')),
         btrim(max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE'))
    into v_token, v_remitente
    from vault.decrypted_secrets
   where name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE');
  if v_token is null then
    raise exception using errcode = '55000',
      message = 'avisos 30: falta LETTERMINT_API_TOKEN en Vault (acción guardar-correo del flujo «Avisos a registrados (base)»)';
  end if;
  if v_token !~ '^[!-~]+$' or length(v_token) not between 20 and 1024 then
    raise exception using errcode = '55000',
      message = 'avisos 30: LETTERMINT_API_TOKEN en Vault no tiene forma de token (20 a 1024 caracteres visibles, sin espacios)';
  end if;
  if coalesce(v_remitente, '') !~*
     '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'avisos 30: falta RWADAR_REMITENTE en Vault o no es una dirección de correo válida';
  end if;
end
$vault$;

-- Si ya estaba encendido se conserva la fecha; si no, empieza una frontera
-- nueva: solo se reparten los anuncios creados después.
update rwadar_novedades.configuracion
   set correo_activado_el = case when correo_habilitado and correo_activado_el is not null
                                 then correo_activado_el else clock_timestamp() end,
       correo_habilitado = true
 where unica;

update rwadar_novedades.correos
   set estado = 'descartado', terminado_el = now(),
       error = 'No enviado: anterior a la activación del correo'
 where estado = 'pendiente'
   and creado_el < (select correo_activado_el from rwadar_novedades.configuracion where unica);

do $relojes$
declare
  v_job record;
begin
  -- Cualquier reloj que llame a rwadar_novedades, salvo el diario de
  -- limpieza de la 30 tal cual (ese se queda siempre).
  for v_job in
    select jobname from cron.job
     where (jobname = 'rwadar-novedades'
            or lower(coalesce(command, '')) like '%rwadar_novedades.%')
       and not (jobname = 'rwadar-novedades-limpieza'
                and lower(btrim(coalesce(command, ''))) = 'select rwadar_novedades.limpiar()')
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end
$relojes$;

select cron.schedule('rwadar-novedades', '*/5 * * * *', $$ select rwadar_novedades.procesar() $$);

commit;
