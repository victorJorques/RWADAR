-- =====================================================================
-- RWAdar 30 · ENCENDER el correo de los avisos (Brevo)
-- ---------------------------------------------------------------------
-- Solo con permiso expreso de Víctor y después de (contrato, «Activación»):
-- dominio propio; Brevo con el dominio autenticado, el contrato de encargo
-- aceptado y archivado y el seguimiento de aperturas y clics desactivado;
-- BREVO_API_KEY y RWADAR_REMITENTE en Vault. Después: el verificador 30 y
-- una prueba con una cuenta propia (sin píxel, enlaces directos y la baja de
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

-- Los secretos se comprueban sin devolver sus valores.
do $vault$
declare
  v_clave text;
  v_remitente text;
begin
  select max(decrypted_secret) filter (where name = 'BREVO_API_KEY'),
         max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE')
    into v_clave, v_remitente
    from vault.decrypted_secrets
   where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
  if length(btrim(coalesce(v_clave, ''))) < 20
     or btrim(coalesce(v_remitente, '')) !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'avisos 30: configura BREVO_API_KEY y RWADAR_REMITENTE válidos en Vault';
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
