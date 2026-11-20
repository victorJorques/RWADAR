-- =====================================================================
-- RWAdar 37 · verificador: el directo ya no gasta la secuencia de tokens
-- Solo lee. Cualquier desviación aborta con una excepción. Comprueba que
-- las cuatro altas de tokens tienen el cuerpo de la 37 (solo los cg_id
-- nuevos piden id) y que la identidad de rwadar_mercado.tokens tiene
-- margen y va por delante del mayor id. El resto lo mira el de la 35.
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_funcion text;
  v_cuerpo text;
  v_secuencia text;
  v_ultimo bigint;
  v_llamada boolean;
  v_tope bigint;
  v_siguiente bigint;
  v_max integer;
  v_n integer;
begin
  if to_regclass('rwadar_mercado.tokens') is null then
    raise exception '37: falta aplicar 35_mercado_directo.sql';
  end if;

  -- Las cuatro altas, con el cuerpo de la 37.
  foreach v_funcion in array array['rwadar_mercado.guardar_diaria(text)', 'rwadar_mercado.guardar_mercados(text,timestamp with time zone)',
                                   'rwadar_mercado.sembrar(jsonb)', 'rwadar_mercado.cerrar_siembra(jsonb,timestamp with time zone,timestamp with time zone)'] loop
    if to_regprocedure(v_funcion) is null then
      raise exception '37: falta %', v_funcion;
    end if;
    select p.prosrc into v_cuerpo from pg_proc p where p.oid = to_regprocedure(v_funcion);
    if position('RWAdar 37: solo los cg_id nuevos piden id a la secuencia' in v_cuerpo) = 0
       or (v_funcion not like 'rwadar_mercado.sembrar(%' and position('where not exists (select 1 from rwadar_mercado.tokens' in v_cuerpo) = 0) then
      raise exception '37: % sigue con el alta de la 35 (falta aplicar 37_mercado_directo_secuencia.sql)', v_funcion;
    end if;
  end loop;

  -- La identidad: por delante del mayor id y con margen.
  v_secuencia := pg_get_serial_sequence('rwadar_mercado.tokens', 'id');
  if v_secuencia is null then raise exception '37: rwadar_mercado.tokens.id sin secuencia'; end if;
  execute format('select last_value, is_called from %s', v_secuencia) into v_ultimo, v_llamada;
  select s.seqmax into v_tope from pg_sequence s where s.seqrelid = v_secuencia::regclass;
  v_siguiente := case when v_llamada then v_ultimo + 1 else v_ultimo end;
  select coalesce(max(id), 0), count(*) into v_max, v_n from rwadar_mercado.tokens;
  if v_siguiente <= v_max then
    raise exception '37: la secuencia de tokens (siguiente %) no va por delante del mayor id (%)', v_siguiente, v_max;
  end if;
  if v_tope - v_siguiente < 10000 then
    raise exception '37: a la secuencia de tokens le quedan % ids (siguiente %, tope %)', v_tope - v_siguiente + 1, v_siguiente, v_tope;
  end if;

  raise notice 'RWAdar 37 OK: altas de tokens sin gastar la secuencia; % tokens, siguiente id %, quedan % de %',
    v_n, v_siguiente, v_tope - v_siguiente + 1, v_tope;
end
$verificador$;

rollback;
