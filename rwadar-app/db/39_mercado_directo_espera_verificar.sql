-- =====================================================================
-- RWAdar 39 · verificador: las esperas del directo ya no se desbordan
-- Solo lee. Cualquier desviación aborta con una excepción. Comprueba con
-- pg_get_functiondef que pedir_coingecko y leer_respuesta tienen las
-- fórmulas de la 39 y ningún exponente sin tope, y calcula con esas
-- fórmulas las esperas: las de siempre (15, 30 y 60 minutos tras 3, 4 y 5
-- fallos seguidos; 10, 20, 40 y 60 tras 2 a 5 429 seguidos) y 60 minutos,
-- sin «interval out of range», con fallos_seguidos 36, 40 y 576 y con
-- seguidos_429 35 y 40. El resto lo mira el de la 35.
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  -- Las dos fórmulas de la 39, tal cual están escritas en las funciones.
  v_fallos constant text := 'least(interval ''15 minutes'' * power(2, least(fallos_seguidos + 1 - 3, 2)), interval ''60 minutes'')';
  v_429 constant text := 'least(interval ''5 minutes'' * power(2, least(c.seguidos_429, 4)), interval ''60 minutes'')';
  v_funcion text;
  v_con_fallos integer;
  v_con_429 integer;
  v_def text;
  v_caso record;
  v_espera interval;
begin
  if to_regclass('rwadar_mercado.configuracion') is null then
    raise exception '39: falta aplicar 35_mercado_directo.sql';
  end if;

  -- Las dos funciones con esperas: cuántas veces lleva cada fórmula y
  -- ningún power() que no sea power(2, least(…)).
  for v_funcion, v_con_fallos, v_con_429 in
    select * from (values ('rwadar_mercado.pedir_coingecko(boolean)', 1, 0),
                          ('rwadar_mercado.leer_respuesta(boolean)', 1, 1)) x(funcion, fallos, s429) loop
    if to_regprocedure(v_funcion) is null then
      raise exception '39: falta %', v_funcion;
    end if;
    v_def := pg_get_functiondef(to_regprocedure(v_funcion));
    if v_def ~* 'power\s*\((?!2, least\()'
       or (length(v_def) - length(replace(v_def, v_fallos, ''))) / length(v_fallos) <> v_con_fallos
       or (length(v_def) - length(replace(v_def, v_429, ''))) / length(v_429) <> v_con_429 then
      raise exception '39: % sigue con la espera de la 35 (falta aplicar 39_mercado_directo_espera.sql)', v_funcion;
    end if;
  end loop;

  -- Las esperas, con las fórmulas de la base (fallos_seguidos y
  -- seguidos_429 son los de antes de apuntar el fallo).
  for v_caso in
    select * from (values ('fallos', 2, 15), ('fallos', 3, 30), ('fallos', 4, 60), ('fallos', 5, 60),
                          ('fallos', 36, 60), ('fallos', 40, 60), ('fallos', 576, 60),
                          ('429', 1, 10), ('429', 2, 20), ('429', 3, 40), ('429', 4, 60),
                          ('429', 35, 60), ('429', 40, 60)) x(tipo, seguidos, minutos) loop
    begin
      if v_caso.tipo = 'fallos' then
        execute format('select %s', replace(v_fallos, 'fallos_seguidos', v_caso.seguidos::text)) into v_espera;
      else
        execute format('select %s', replace(v_429, 'c.seguidos_429', v_caso.seguidos::text)) into v_espera;
      end if;
    exception when others then
      raise exception '39: la espera con % % seguidos da error (%)', v_caso.seguidos, v_caso.tipo, sqlerrm;
    end;
    if v_espera <> make_interval(mins => v_caso.minutos) then
      raise exception '39: la espera con % % seguidos es % (debe ser % minutos)', v_caso.seguidos, v_caso.tipo, v_espera, v_caso.minutos;
    end if;
  end loop;

  raise notice 'RWAdar 39 OK: esperas con tope en pedir_coingecko y leer_respuesta; 60 minutos con 36, 40 y 576 fallos seguidos y con 35 y 40 429 seguidos';
end
$verificador$;

rollback;
