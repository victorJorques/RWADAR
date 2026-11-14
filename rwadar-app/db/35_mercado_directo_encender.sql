-- =====================================================================
-- RWAdar 35 · encender el gráfico en directo
-- Exige la 35 y una siembra de menos de 30 minutos (la acción «encender»
-- del flujo siembra antes, en la misma ejecución): así la edad de cada
-- token se mide desde una historia completa y el primer documento sale
-- entero. Pone encendido = true, borra las esperas y crea los dos relojes
-- (quita antes los rwadar-mercado-* que hubiera: se puede repetir).
-- =====================================================================
begin;

do $encender$
declare
  v_sembrado timestamptz;
begin
  if to_regprocedure('rwadar_mercado.pedir()') is null or to_regprocedure('rwadar_mercado.leer()') is null then
    raise exception using errcode = '55000', message = 'RWAdar 35: falta aplicar 35_mercado_directo.sql';
  end if;
  select sembrado_el into v_sembrado from rwadar_mercado.configuracion where unica;
  if v_sembrado is null or v_sembrado < rwadar_mercado.reloj() - interval '30 minutes' then
    raise exception using errcode = '55000',
      message = 'RWAdar 35: la siembra falta o tiene más de 30 minutos; enciende con la acción «encender», que siembra antes';
  end if;
end
$encender$;

select pg_advisory_xact_lock(20261113, 35);

update rwadar_mercado.configuracion
   set encendido = true, peticion_id = null, pedido_el = null, reintentar_desde = null,
       fallos_seguidos = 0, seguidos_429 = 0
 where unica;

select cron.unschedule(jobname) from cron.job where jobname like 'rwadar-mercado-%';
select cron.schedule('rwadar-mercado-pedir', '3,8,13,18,23,28,33,38,43,48,53,58 * * * *', 'select rwadar_mercado.pedir()');
select cron.schedule('rwadar-mercado-leer', '4,9,14,19,24,29,34,39,44,49,54,59 * * * *', 'select rwadar_mercado.leer()');

commit;
