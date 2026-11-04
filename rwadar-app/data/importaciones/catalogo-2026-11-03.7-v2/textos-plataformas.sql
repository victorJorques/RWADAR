-- Aparte del lote 2026-11-03.7: textos de public.plataformas y public.fuentes, que el lote diario
-- solo lee (CICLO-DIARIO-CATALOGO.md §5). Se aplica solo si se aprueba tocar esas tablas.
-- Idempotente: con los textos ya cambiados no hace nada.
begin isolation level serializable;
-- Textos para el lector en public.plataformas y public.fuentes (entrega 2026-11-03.7, 04/11/2026).
-- Reental (fila 18), Toucan (fila 75) y RealT. Solo cambian esos textos y se añade una fuente
-- a RealT. No toca el estado de ninguna plataforma, así que no registra cambios de estado
-- ni avisos; el disparador de siempre pone actualizada_el = now() en las tres filas.
do $textos_guarda$
begin
  if (select count(*) from public.plataformas where slug = 'reental' and estado = 'en_radar'
      and nota in ('Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.', 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €.')) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', 'reental', 'nota';
  end if;
  if (select count(*) from public.plataformas where slug = 'toucan-protocol' and estado = 'descartada'
      and motivo_descarte in ('El bloqueo no es suyo sino del registro: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.', 'El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.')) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', 'toucan-protocol', 'motivo_descarte';
  end if;
  if (select count(*) from public.plataformas where slug = 'realt' and estado = 'descartada'
      and etiqueta_descarte in ('En liquidación', 'Liquidación anunciada')) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', 'realt', 'etiqueta_descarte';
  end if;
  if (select count(*) from public.plataformas where slug = 'realt' and estado = 'descartada'
      and motivo_descarte in ('Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.', 'En julio de 2025, Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones. Un juez le prohibió cobrar alquileres hasta que las viviendas cumplieran la normativa y le ordenó repararlas. En julio de 2026 la empresa anunció una liquidación voluntaria y la venta de toda su cartera. Había vendido, en forma de tokens, participaciones de unos 700 inmuebles de Detroit.')) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', 'realt', 'motivo_descarte';
  end if;
  if (select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
      where p.slug = 'realt' and f.url in ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'https://www.bridgedetroit.com/real-token-detroit-rent-repairs/')) <> 3
    or exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
      where p.slug = 'realt' and f.url not in ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/')) then
    raise exception 'Fuentes de RealT distintas de las previstas: no aplicar.';
  end if;
end $textos_guarda$;
update public.plataformas set nota = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €.' where slug = 'reental' and nota = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.';
update public.plataformas set motivo_descarte = 'El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.' where slug = 'toucan-protocol' and motivo_descarte = 'El bloqueo no es suyo sino del registro: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.';
update public.plataformas set etiqueta_descarte = 'Liquidación anunciada' where slug = 'realt' and etiqueta_descarte = 'En liquidación';
update public.plataformas set motivo_descarte = 'En julio de 2025, Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones. Un juez le prohibió cobrar alquileres hasta que las viviendas cumplieran la normativa y le ordenó repararlas. En julio de 2026 la empresa anunció una liquidación voluntaria y la venta de toda su cartera. Había vendido, en forma de tokens, participaciones de unos 700 inmuebles de Detroit.' where slug = 'realt' and motivo_descarte = 'Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.';
insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/','Outlier Media · RealT anuncia que venderá sus inmuebles de Detroit','2026-07-16'::date,'2026-11-04'::date from public.plataformas where slug = 'realt' on conflict (plataforma_id,url) do nothing;
do $textos_comprobar$
begin
  if (select nota from public.plataformas where slug = 'reental') is distinct from 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €.' then
    raise exception 'No quedó el texto nuevo de % (%).', 'reental', 'nota';
  end if;
  if (select motivo_descarte from public.plataformas where slug = 'toucan-protocol') is distinct from 'El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.' then
    raise exception 'No quedó el texto nuevo de % (%).', 'toucan-protocol', 'motivo_descarte';
  end if;
  if (select etiqueta_descarte from public.plataformas where slug = 'realt') is distinct from 'Liquidación anunciada' then
    raise exception 'No quedó el texto nuevo de % (%).', 'realt', 'etiqueta_descarte';
  end if;
  if (select motivo_descarte from public.plataformas where slug = 'realt') is distinct from 'En julio de 2025, Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones. Un juez le prohibió cobrar alquileres hasta que las viviendas cumplieran la normativa y le ordenó repararlas. En julio de 2026 la empresa anunció una liquidación voluntaria y la venta de toda su cartera. Había vendido, en forma de tokens, participaciones de unos 700 inmuebles de Detroit.' then
    raise exception 'No quedó el texto nuevo de % (%).', 'realt', 'motivo_descarte';
  end if;
  if (select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt')
      <> 4 then
    raise exception 'RealT no tiene sus 4 fuentes.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> 4 then
    raise exception 'Tiene que haber exactamente 4 descartadas.';
  end if;
end $textos_comprobar$;
commit;
