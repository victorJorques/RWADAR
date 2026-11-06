-- =====================================================================
-- RWAdar 31 · guardar en Vault el token de Lettermint y el remitente
-- ---------------------------------------------------------------------
-- Lo ejecuta .github/workflows/avisos-base.yml (acción guardar-correo),
-- siempre con orden expresa de Víctor y una copia hecha antes:
--
--   psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 \
--     -v token="$LETTERMINT_API_TOKEN" -v remitente="$REMITENTE" \
--     -f rwadar-app/db/31_correo_lettermint_guardar.sql
--
-- token     = token de proyecto de Lettermint (secreto de GitHub
--             LETTERMINT_API_TOKEN). Va a Vault como LETTERMINT_API_TOKEN.
-- remitente = la dirección desde la que salen los avisos, del dominio
--             verificado en Lettermint (no es secreta). Va a Vault como
--             RWADAR_REMITENTE; el correo sale como «RWAdar <remitente>».
--
-- Crea cada secreto con vault.create_secret o, si ya existe, lo cambia con
-- vault.update_secret: nunca quedan dos con el mismo nombre. No enciende el
-- correo (eso es 30_avisos_registrados_activar_correo.sql) y no imprime
-- ningún valor: solo dice si quedaron guardados y con forma válida. Las
-- entradas llegan como variables de psql y se usan SOLO como literales
-- (`:'variable'`, que psql escapa); psql no sustituye variables dentro de un
-- bloque `do $…$`, así que pasan por dos ajustes locales a la transacción
-- (`set_config(…, true)`), que desaparecen al terminar. Van en un SELECT y
-- nunca en una sentencia DDL (CREATE … AS, por ejemplo): Supabase registra
-- por defecto las DDL del rol postgres (`log_statement = 'ddl'`) con su
-- texto entero, y el token quedaría en claro en los registros de Postgres.
-- Una sola transacción: un fallo no deja nada a medias.
-- =====================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin;

select set_config('rwadar.guardar_token', :'token', true) is not null
   and set_config('rwadar.guardar_remitente', :'remitente', true) is not null as preparado;

do $guardar$
declare
  e record;
  v_nombre text;
  v_valor text;
  v_id uuid;
  v_token text;
  v_remitente text;
begin
  if to_regclass('vault.secrets') is null or to_regclass('vault.decrypted_secrets') is null
     or to_regprocedure('vault.create_secret(text,text,text,uuid)') is null
     or to_regprocedure('vault.update_secret(uuid,text,text,text,uuid)') is null then
    raise exception using errcode = '55000', message = 'avisos 31: falta Vault (vault.create_secret / vault.update_secret)';
  end if;
  select btrim(current_setting('rwadar.guardar_token', true)) as token,
         btrim(current_setting('rwadar.guardar_remitente', true)) as remitente into e;
  -- Solo la forma, nunca el valor en el mensaje.
  if coalesce(e.token, '') !~ '^[!-~]+$' or length(e.token) not between 20 and 1024 then
    raise exception using errcode = '22023',
      message = 'avisos 31: el token de Lettermint falta o no tiene forma de token (20 a 1024 caracteres visibles, sin espacios)';
  end if;
  if coalesce(e.remitente, '') !~*
     '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '22023',
      message = 'avisos 31: el remitente falta o no es una dirección de correo válida';
  end if;

  foreach v_nombre in array array['LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE'] loop
    v_valor := case v_nombre when 'LETTERMINT_API_TOKEN' then e.token else e.remitente end;
    v_id := null;
    select s.id into v_id from vault.secrets s where s.name = v_nombre;
    if v_id is null then
      perform vault.create_secret(new_secret := v_valor, new_name := v_nombre,
        new_description := case v_nombre when 'LETTERMINT_API_TOKEN'
                                then 'RWAdar 31: token de proyecto de Lettermint (avisos a registrados)'
                                else 'RWAdar 31: remitente de los avisos a registrados' end);
    else
      perform vault.update_secret(secret_id := v_id, new_secret := v_valor);
    end if;
  end loop;

  -- Comprobación de vuelta, como la hará enviar_correos(): uno de cada y con forma.
  if (select count(*) from vault.decrypted_secrets s
       where s.name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE')) <> 2 then
    raise exception using errcode = '55000', message = 'avisos 31: Vault no quedó con un LETTERMINT_API_TOKEN y un RWADAR_REMITENTE';
  end if;
  select btrim(max(s.decrypted_secret) filter (where s.name = 'LETTERMINT_API_TOKEN')),
         btrim(max(s.decrypted_secret) filter (where s.name = 'RWADAR_REMITENTE'))
    into v_token, v_remitente
    from vault.decrypted_secrets s
   where s.name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE');
  if v_token is distinct from e.token or v_remitente is distinct from e.remitente then
    raise exception using errcode = '55000', message = 'avisos 31: Vault no devuelve lo que se acaba de guardar';
  end if;
  raise notice 'avisos 31: LETTERMINT_API_TOKEN y RWADAR_REMITENTE guardados en Vault con forma válida. El correo sigue como estaba (para encenderlo: 30_avisos_registrados_activar_correo.sql).';
end
$guardar$;

commit;
