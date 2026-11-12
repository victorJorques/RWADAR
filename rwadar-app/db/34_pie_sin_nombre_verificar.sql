-- =====================================================================
-- RWAdar 34 · verificador del pie sin el nombre del titular
-- Solo lee: no envía, no agenda y no lee Vault. Cualquier desviación aborta
-- con una excepción. Va junto a los verificadores 30 a 33, que siguen
-- valiendo (el 31 mira la dirección postal del pie, no el nombre).
--
-- Comprueba que correo_mensaje es la de la 34: el pie de cada correo dice
-- «Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira
-- (Valencia), España», con el aviso legal y la privacidad enlazados, y no
-- lleva el nombre del titular (ni en la función ni en un correo construido
-- de verdad); que lo demás del pie sigue (por qué lo recibe y, en los
-- anuncios, la baja); que el envío sigue siendo el de Lettermint (la 31); y
-- que conserva lo de la 30: security definer, search_path vacío, estable,
-- el mismo dueño que el resto del esquema y ningún permiso de ejecución
-- para los clientes.
-- =====================================================================
begin transaction read only;

do $verificador_34$
declare
  v_firma constant text := 'rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)';
  v_rol text;
  v_definicion text;
  v_correo jsonb;
  v_baja uuid;
  v_responsable constant text := 'Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España';
  v_aviso_html constant text := '(<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a>'
    || ' · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>';
  v_aviso_txt constant text := E'.\nAviso legal: https://rwadar.pages.dev/privacidad#aviso-legal\n'
    || E'Privacidad: https://rwadar.pages.dev/privacidad\n';
begin
  if to_regprocedure('rwadar_novedades.procesar()') is null or to_regprocedure(v_firma) is null then
    raise exception '34: falta la 30 (aplicar 30_avisos_registrados.sql, 31_correo_lettermint.sql y 34_pie_sin_nombre.sql)';
  end if;
  if position('https://api.lettermint.co/v1/send' in
              pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure)) = 0 then
    raise exception '34: el envío no es el de Lettermint (¿se reaplicó la 30? Aplica la 31 y después la 34)';
  end if;

  -- La función: plpgsql, security definer, search_path vacío, estable, jsonb,
  -- el dueño de procesar() y nadie más la ejecuta.
  if not exists (
       select 1 from pg_proc p join pg_language l on l.oid = p.prolang
        where p.oid = to_regprocedure(v_firma)
          and p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
          and l.lanname = 'plpgsql' and p.prorettype = 'jsonb'::regtype and p.provolatile = 's') then
    raise exception '34: % ya no es plpgsql security definer con search_path vacío, estable y con resultado jsonb', v_firma;
  end if;
  if (select p.proowner from pg_proc p where p.oid = to_regprocedure(v_firma))
     <> (select p.proowner from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure) then
    raise exception '34: % no tiene el mismo dueño que rwadar_novedades.procesar()', v_firma;
  end if;
  foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
    if has_function_privilege(v_rol, v_firma, 'EXECUTE') then
      raise exception '34: % es ejecutable por % (solo la ejecuta el propietario)', v_firma, v_rol;
    end if;
  end loop;

  -- Sin el nombre en la función (también en sus comentarios).
  v_definicion := pg_get_functiondef(to_regprocedure(v_firma));
  if v_definicion ~* '(j[o]rques|gr[a]nero|v[ií]ctor manuel)' then
    raise exception '34: el pie vuelve a llevar el nombre del titular (¿se reaplicó la 31 después? Vuelve a aplicar 34_pie_sin_nombre.sql)';
  end if;

  -- Una bienvenida sin avisos: el pie nuevo, en HTML y en texto, sin baja.
  v_correo := rwadar_novedades.correo_mensaje('bienvenida', null, null, null, false, null);
  if position(v_responsable || ' ' || v_aviso_html in v_correo ->> 'html') = 0
     or position(v_responsable || v_aviso_txt
                 || 'Recibes este correo porque se ha confirmado una cuenta de RWAdar con esta dirección.'
                 in v_correo ->> 'texto') = 0
     or position('Te escribe RWAdar, un radar independiente de plataformas de tokenización. ' || v_responsable
                 in v_correo ->> 'texto') = 0
     or position('baja?t=' in (v_correo ->> 'html') || (v_correo ->> 'texto')) > 0 then
    raise exception '34: la bienvenida no lleva en el pie al titular sin su nombre, la dirección postal, el aviso legal y la privacidad, o lleva baja sin estar apuntada';
  end if;
  if ((v_correo ->> 'html') || (v_correo ->> 'texto')) ~* '(j[o]rques|gr[a]nero|v[ií]ctor)' then
    raise exception '34: la bienvenida lleva el nombre del titular';
  end if;

  -- Un anuncio: el mismo pie, por qué lo recibe y la baja (enlace y mailto).
  v_baja := gen_random_uuid();
  v_correo := rwadar_novedades.correo_mensaje('anuncio', 'Prueba del verificador', 'Texto de prueba.',
                                              'https://rwadar.pages.dev/', true, v_baja);
  if position(v_responsable || ' ' || v_aviso_html in v_correo ->> 'html') = 0
     or position(v_responsable || v_aviso_txt
                 || 'Recibes este aviso porque te apuntaste a los avisos de novedades de RWAdar.' || E'\n'
                 || 'Para darte de baja de los avisos: https://rwadar.pages.dev/baja?t=' || v_baja::text
                 || ' o escribe a rwadares@gmail.com.' in v_correo ->> 'texto') = 0
     or position('href="https://rwadar.pages.dev/baja?t=' || v_baja::text || '"' in v_correo ->> 'html') = 0
     or position('href="mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar"' in v_correo ->> 'html') = 0 then
    raise exception '34: un anuncio no lleva en el pie al titular sin su nombre, la dirección postal, el aviso legal, el motivo o la baja';
  end if;
  if ((v_correo ->> 'html') || (v_correo ->> 'texto')) ~* '(j[o]rques|gr[a]nero|v[ií]ctor)' then
    raise exception '34: un anuncio lleva el nombre del titular';
  end if;

  raise notice 'RWAdar 34 OK: el pie de los correos lleva al titular de RWAdar sin su nombre, con la dirección postal, el aviso legal y la privacidad; la baja sigue en los anuncios';
end
$verificador_34$;

rollback;
