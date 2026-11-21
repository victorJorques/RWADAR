-- =====================================================================
-- RWAdar 39 · las esperas del directo, sin desbordarse
-- ---------------------------------------------------------------------
-- Del 18 al 20/11/2026 el reloj rwadar-mercado-pedir falló 576 veces
-- seguidas con «ERROR: interval out of range» (log del «Vigilante» del
-- 20/11) y «Tokenización diaria» falló con 503 directo_atrasado. La 35
-- calcula la espera tras fallos multiplicando 15 minutos por 2 elevado a
-- (fallos seguidos - 2) y solo después la limita a 60 minutos con least():
-- con 36 fallos seguidos o más, el producto se sale del tipo interval
-- antes de llegar a least(). Lo mismo con la espera de los 429 (5 minutos
-- por 2 elevado a los 429 seguidos) desde 35 seguidos. La propia
-- actualización que apunta el fallo da error, así que fallos_seguidos
-- nunca vuelve a 0 y el reloj falla en cada vuelta.
--
-- Arreglo: pedir_coingecko y leer_respuesta, las dos funciones de la 35
-- con esas fórmulas (la 37 no las toca), con el exponente limitado antes
-- de multiplicar: power(2, least(fallos_seguidos + 1 - 3, 2)) (15 * 4 = 60
-- minutos, el tope que ya ponía least) y power(2, least(c.seguidos_429, 4))
-- (5 * 16 = 80 minutos, que least deja en 60). Las esperas son las mismas
-- de antes (15, 30 y 60; 10, 20, 40 y 60), solo que ya no se desbordan.
-- Todo lo demás, idéntico a la 35 (firmas, security definer, search_path
-- vacío y permisos). Idempotente: se puede aplicar dos veces.
-- Copia idéntica: supabase/migrations/20261121120000_mercado_directo_espera.sql.
--
-- Solo con orden expresa de la dirección y con el flujo «Mercado en
-- directo (base)» (ensayo-39, aplicar-39 y verificar-39). Si la 35 no
-- está, falla sin dejar nada. Verificador:
-- 39_mercado_directo_espera_verificar.sql. Contrato:
-- docs/tareas/MERCADO-DIRECTO-2026-11-14.md.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_mercado.configuracion') is null
     or to_regprocedure('rwadar_mercado.pedir_coingecko(boolean)') is null
     or to_regprocedure('rwadar_mercado.leer_respuesta(boolean)') is null then
    raise exception using errcode = '55000', message = 'RWAdar 39: falta aplicar 35_mercado_directo.sql';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que toman pedir() y leer(): ninguna vuelta del reloj
-- corre a medias con las funciones viejas y las nuevas.
select pg_advisory_xact_lock(20261113, 35);

-- ---------------------------------------------------------------------
-- 1 · Las dos funciones con esperas, con el exponente con tope
-- ---------------------------------------------------------------------

-- Una petición a CoinGecko, si toca (como en la 35). Una en vuelo de más
-- de 2 minutos se da por perdida y cuenta como fallo: desde el tercero
-- seguido, 15, 30 y 60 minutos.
create or replace function rwadar_mercado.pedir_coingecko(p_prueba boolean) returns text
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_cabeceras jsonb := '{"accept": "application/json", "user-agent": "RWAdar/1.0 (+https://rwadar.pages.dev)"}';
  v_clave text;
  v_id bigint;
  v_mes date := date_trunc('month', v_ahora at time zone 'UTC')::date;
begin
  select * into c from rwadar_mercado.configuracion where unica for update;
  -- Nunca dos en la misma ranura ni a menos de 240 s (sin tocar nada).
  if c.ultimo_pedido_el is not null
     and (floor((extract(epoch from c.ultimo_pedido_el) - 180) / 300) >= floor((extract(epoch from v_ahora) - 180) / 300)
          or c.ultimo_pedido_el > v_ahora - interval '240 seconds') then
    return 'pronto';
  end if;
  if c.peticion_id is not null then
    if c.pedido_el > v_ahora - interval '2 minutes' then return 'pendiente'; end if;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = 0, error = 'sin_respuesta'
     where peticion = c.peticion_id and leido_el is null;
    -- RWAdar 39: exponente con tope (2): desde 36 fallos seguidos el intervalo se desbordaba.
    update rwadar_mercado.configuracion
       set peticion_id = null, pedido_el = null, seguidos_429 = 0,
           fallos_seguidos = fallos_seguidos + 1,
           reintentar_desde = case when fallos_seguidos + 1 >= 3
             then c.pedido_el + least(interval '15 minutes' * power(2, least(fallos_seguidos + 1 - 3, 2)), interval '60 minutes') - interval '30 seconds'
             else reintentar_desde end
     where unica
     returning * into c;
  end if;
  if c.reintentar_desde > v_ahora then return 'espera'; end if;
  -- La clave Demo de CoinGecko, solo si existe en Vault (§3.7 del contrato).
  begin
    select s.decrypted_secret into v_clave from vault.decrypted_secrets s where s.name = 'RWADAR_COINGECKO_DEMO' limit 1;
  exception when others then
    v_clave := null;
  end;
  if v_clave ~ '^[A-Za-z0-9_-]{10,100}$' then
    v_cabeceras := v_cabeceras || jsonb_build_object('x-cg-demo-api-key', v_clave);
  end if;
  v_id := net.http_get(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-products&order=market_cap_desc&per_page=250',
    '{}'::jsonb, v_cabeceras, 20000);
  update rwadar_mercado.configuracion
     set peticion_id = v_id, pedido_el = v_ahora, ultimo_pedido_el = v_ahora,
         llamadas_mes = case when mes = v_mes then llamadas_mes + 1 else 1 end, mes = v_mes
   where unica;
  insert into rwadar_mercado.registro (peticion, pedido_el, prueba) values (v_id, v_ahora, p_prueba);
  return 'pedido';
end
$funcion$;

-- Lo que respondió CoinGecko a la petición en vuelo (como en la 35):
--   429: el primero solo espera a la ranura siguiente, salvo que
--        Retry-After pida más; desde el segundo seguido, 10, 20, 40 y 60
--        minutos (o Retry-After, hasta 1 hora, si es más).
--   otro fallo: desde el tercero seguido, 15, 30 y 60 minutos.
create or replace function rwadar_mercado.leer_respuesta(p_guardar boolean) returns jsonb
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  r record;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_retry text;
  v_espera interval;
  v_estado integer;
  v_bytes integer;
  v_res jsonb;
  v_error text;
begin
  select * into c from rwadar_mercado.configuracion where unica for update;
  if c.peticion_id is null then return jsonb_build_object('coingecko', 'nada'); end if;
  select h.status_code, h.headers, h.content, h.timed_out, h.error_msg, h.created into r
    from net._http_response h where h.id = c.peticion_id;
  if not found then return jsonb_build_object('coingecko', 'esperando'); end if;
  v_estado := coalesce(r.status_code, 0);
  v_bytes := octet_length(r.content);
  if v_estado = 429 then
    select e.value into v_retry from jsonb_each_text(coalesce(r.headers, '{}')) e where lower(e.key) = 'retry-after' limit 1;
    v_espera := case when v_retry ~ '^\d{1,6}$' then make_interval(secs => least(v_retry::integer, 3600)) else interval '0' end;
    if c.seguidos_429 + 1 >= 2 then
      -- RWAdar 39: exponente con tope (4): desde 35 429 seguidos el intervalo se desbordaba.
      v_espera := greatest(v_espera, least(interval '5 minutes' * power(2, least(c.seguidos_429, 4)), interval '60 minutes'));
    end if;
    update rwadar_mercado.configuracion
       set peticion_id = null, pedido_el = null, seguidos_429 = seguidos_429 + 1,
           reintentar_desde = case when v_espera > interval '5 minutes' then c.pedido_el + v_espera - interval '30 seconds' else null end
     where unica;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = 429, bytes = v_bytes, error = 'demasiadas_peticiones'
     where peticion = c.peticion_id;
    return jsonb_build_object('coingecko', 429, 'espera_s', extract(epoch from v_espera)::integer, 'bytes', v_bytes);
  end if;
  if v_estado = 200 then
    begin
      if p_guardar then
        v_res := rwadar_mercado.guardar_mercados(r.content, coalesce(r.created, v_ahora));
      else
        -- La prueba (probar-coingecko) no guarda nada: solo cuenta.
        if octet_length(r.content) > 4194304 then raise exception 'demasiado_grande'; end if;
        select jsonb_build_object('validos', count(*), 'guardados', 0,
                 'mas_reciente', rwadar_mercado.iso_segundo(max(m.t)),
                 'primero', (array_agg(m.cg_id order by m.valor desc))[1])
          into v_res from rwadar_mercado.validos_mercados(r.content::jsonb, coalesce(r.created, v_ahora)) m;
      end if;
    exception when others then
      v_error := case when sqlerrm ~ '^[a-z_]{1,40}$' then sqlerrm else 'error_' || lower(sqlstate) end;
    end;
  else
    v_error := case when r.timed_out then 'sin_respuesta' when v_estado = 0 then 'sin_respuesta' else 'http_' || v_estado end;
  end if;
  if v_error is null then
    update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, fallos_seguidos = 0, seguidos_429 = 0,
           reintentar_desde = null where unica;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = v_estado, bytes = v_bytes,
           validos = (v_res->>'validos')::integer, guardados = (v_res->>'guardados')::integer
     where peticion = c.peticion_id;
    return jsonb_build_object('coingecko', 200) || v_res || jsonb_build_object('respondido', coalesce(r.created, v_ahora), 'bytes', v_bytes);
  end if;
  -- RWAdar 39: exponente con tope (2): desde 36 fallos seguidos el intervalo se desbordaba.
  update rwadar_mercado.configuracion
     set peticion_id = null, pedido_el = null, seguidos_429 = 0, fallos_seguidos = fallos_seguidos + 1,
         reintentar_desde = case when fallos_seguidos + 1 >= 3
           then c.pedido_el + least(interval '15 minutes' * power(2, least(fallos_seguidos + 1 - 3, 2)), interval '60 minutes') - interval '30 seconds'
           else null end
   where unica;
  update rwadar_mercado.registro set leido_el = v_ahora, estado = v_estado, bytes = v_bytes, error = v_error
   where peticion = c.peticion_id;
  return jsonb_build_object('coingecko', v_estado, 'error', v_error, 'bytes', v_bytes);
end
$funcion$;

-- ---------------------------------------------------------------------
-- 2 · Permisos: los mismos de la 35 (nada para los clientes)
-- ---------------------------------------------------------------------
revoke all on all tables in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_mercado from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
