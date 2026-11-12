-- =====================================================================
-- RWAdar 32 · guardar la clave VAPID de las notificaciones web
-- ---------------------------------------------------------------------
-- Lo ejecuta .github/workflows/avisos-base.yml (acciones crear-vapid y
-- rotar-vapid), siempre con orden expresa de Víctor y una copia hecha antes:
--
--   psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \
--     -v privada="$PRIVADA" -v publica="$PUBLICA" -v rotar="$ROTAR" \
--     -f rwadar-app/db/32_notificaciones_vapid.sql
--
-- privada = el escalar d de la clave P-256 (32 octetos) en base64url. El par
--           nace en la máquina del flujo (node rwadar-app/enviar-webpush.mjs
--           generar-claves) y va a Vault como RWADAR_VAPID_PRIVADA: nunca a
--           Git ni a la salida del flujo.
-- publica = la clave pública (65 octetos sin comprimir) en base64url. Va a
--           configuracion.webpush_clave_publica; la web la pide con
--           clave_publica_webpush(). No es secreta.
-- rotar   = 'no' (crear-vapid): si ya hay una clave, no cambia nada.
--           'si' (rotar-vapid): la sustituye.
--
-- Cambiar de clave borra las suscripciones web: se hicieron con la clave
-- anterior y los servicios de push las rechazarían. Cada navegador se vuelve
-- a suscribir al abrir la web (mi_aviso_webpush_registrado dice false).
--
-- Crea el secreto con vault.create_secret o, si ya existe, lo cambia con
-- vault.update_secret, como 31_correo_lettermint_guardar.sql: nunca quedan
-- dos con el mismo nombre. No enciende nada (el envío depende de
-- push_habilitado, activar-push) y nunca imprime la privada. Las entradas
-- llegan como variables de psql y solo se usan como literales en un SELECT
-- (set_config local a la transacción), nunca en una sentencia DDL: Supabase
-- registra las DDL del rol postgres con su texto entero. Una sola
-- transacción: un fallo no deja nada a medias.
-- =====================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin;

select set_config('rwadar.vapid_privada', :'privada', true) is not null
   and set_config('rwadar.vapid_publica', :'publica', true) is not null
   and set_config('rwadar.vapid_rotar', :'rotar', true) is not null as preparado;

do $vapid$
declare
  v_privada text;
  v_publica text;
  v_rotar text;
  v_actual text;
  v_id uuid;
  v_secretos integer;
  v_borradas integer;
  v_guardada text;
begin
  if to_regclass('vault.secrets') is null or to_regclass('vault.decrypted_secrets') is null
     or to_regprocedure('vault.create_secret(text,text,text,uuid)') is null
     or to_regprocedure('vault.update_secret(uuid,text,text,text,uuid)') is null then
    raise exception using errcode = '55000', message = 'avisos 32: falta Vault (vault.create_secret / vault.update_secret)';
  end if;
  if not exists (select 1 from pg_attribute
                  where attrelid = to_regclass('rwadar_novedades.configuracion')
                    and attname = 'webpush_clave_publica' and not attisdropped) then
    raise exception using errcode = '55000', message = 'avisos 32: falta aplicar antes 32_notificaciones.sql (aplicar-32)';
  end if;
  v_privada := btrim(coalesce(current_setting('rwadar.vapid_privada', true), ''));
  v_publica := btrim(coalesce(current_setting('rwadar.vapid_publica', true), ''));
  v_rotar := btrim(coalesce(current_setting('rwadar.vapid_rotar', true), ''));
  -- Solo la forma, nunca el valor en el mensaje.
  if v_privada !~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$' then
    raise exception using errcode = '22023',
      message = 'avisos 32: la clave privada VAPID falta o no tiene forma de clave P-256 (32 octetos en base64url)';
  end if;
  if v_publica !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$' then
    raise exception using errcode = '22023',
      message = 'avisos 32: la clave pública VAPID falta o no es un punto P-256 sin comprimir en base64url';
  end if;
  if v_rotar not in ('si', 'no') then
    raise exception using errcode = '22023', message = 'avisos 32: rotar debe ser si o no';
  end if;

  select c.webpush_clave_publica into v_actual from rwadar_novedades.configuracion c where c.unica for update;
  if not found then
    raise exception using errcode = '55000', message = 'avisos 32: falta la fila de configuración (aplicar 30_avisos_registrados.sql)';
  end if;
  select count(*) into v_secretos from vault.secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if v_secretos > 1 then
    raise exception using errcode = '55000', message = 'avisos 32: hay más de un RWADAR_VAPID_PRIVADA en Vault: revisar a mano';
  end if;
  if v_actual is not null and v_secretos = 1 and v_rotar = 'no' then
    raise notice 'avisos 32: ya hay una clave VAPID y no se cambia (para sustituirla: rotar-vapid). Clave pública: %', v_actual;
    return;
  end if;

  select s.id into v_id from vault.secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if v_id is null then
    perform vault.create_secret(new_secret := v_privada, new_name := 'RWADAR_VAPID_PRIVADA',
      new_description := 'RWAdar 32: clave privada VAPID de las notificaciones web');
  else
    perform vault.update_secret(secret_id := v_id, new_secret := v_privada);
  end if;
  v_borradas := 0;
  if v_actual is distinct from v_publica then
    delete from rwadar_novedades.suscripciones_web;
    get diagnostics v_borradas = row_count;
  end if;
  update rwadar_novedades.configuracion set webpush_clave_publica = v_publica where unica;

  -- Comprobación de vuelta, como la hará el flujo «Notificaciones web».
  if (select count(*) from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA') <> 1 then
    raise exception using errcode = '55000', message = 'avisos 32: Vault no quedó con un RWADAR_VAPID_PRIVADA';
  end if;
  select btrim(s.decrypted_secret) into v_guardada from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if v_guardada is distinct from v_privada then
    raise exception using errcode = '55000', message = 'avisos 32: Vault no devuelve la clave que se acaba de guardar';
  end if;
  raise notice 'avisos 32: clave VAPID guardada (la privada en Vault como RWADAR_VAPID_PRIVADA; la pública en la configuración): %. Suscripciones web borradas por el cambio de clave: %. El envío sigue como estaba (push_habilitado).',
    v_publica, v_borradas;
end
$vapid$;

commit;
