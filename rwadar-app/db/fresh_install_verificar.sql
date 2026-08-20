-- =====================================================================
-- RWAdar · contrato mínimo de una instalación nueva completa
-- =====================================================================
begin transaction read only;

do $$
declare
  v_en_radar integer;
  v_descartadas integer;
begin
  select count(*) filter (where estado = 'en_radar'),
         count(*) filter (where estado = 'descartada')
    into v_en_radar, v_descartadas
    from public.plataformas;

  if v_en_radar <> 26 or v_descartadas <> 4 then
    raise exception 'fresh-install: esperaba 26/4 y obtuvo %/%',
      v_en_radar, v_descartadas;
  end if;

  if exists (select 1 from public.descartadas_sin_fuente) then
    raise exception 'fresh-install: hay descartadas sin fuente';
  end if;

  if to_regclass('public.avisos_push') is null
     or to_regprocedure('public.push_ciclo()') is null
     or to_regclass('public.push_configuracion') is null
     or to_regclass('public.retencion_dispositivos_estado') is null
     or to_regclass('public.emisiones') is null
     or to_regclass('public.emisiones_publicas') is null
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'emisiones'
          and column_name = 'continua'
     ) then
    raise exception 'fresh-install: faltan push o emisiones 17-21';
  end if;

  if (select count(*) from public.push_configuracion
       where singleton and not habilitado and activado_el is null) <> 1
     or exists (select 1 from cron.job where jobname = 'rwadar-push') then
    raise exception 'fresh-install: push debe quedar apagado y sin cron';
  end if;

  if (select count(*) from cron.job
       where jobname = 'rwadar-retencion-dispositivos'
         and schedule = '17 3 * * *'
         and command like '%retencion_dispositivos_ciclo%') <> 1 then
    raise exception 'fresh-install: falta el cron diario de retención';
  end if;

  if to_regprocedure('public.moderar(uuid,uuid,text,text)') is not null
     or has_column_privilege('anon', 'opiniones', 'usuario_id', 'SELECT')
     or has_table_privilege('authenticated', 'opiniones', 'INSERT') then
    raise exception 'fresh-install: reapareció el contrato inseguro de 16';
  end if;

  raise notice 'RWAdar fresh-install OK: 26/4, push apagado, retención, emisiones y seguridad';
end $$;

rollback;
