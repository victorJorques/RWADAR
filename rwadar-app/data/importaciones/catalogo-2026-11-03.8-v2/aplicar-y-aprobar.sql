-- Entrega 2026-11-03.8 (preparada el 04/11/2026): solo los textos de public.plataformas y public.fuentes
-- de Reental, Toucan y RealT que quedaron fuera de la 2026-11-03.7. Pedida por Víctor.
-- No es un lote del catálogo: no crea ni aprueba ninguna revisión; la publicada sigue siendo la
-- f2732257-206d-48ce-2067-c7e19fa33002 (2026-11-03.7), y se exige que lo sea.
-- Generado localmente por rwadar-app/data/verificaciones/2026-11-03.8-v2/preparar-entrega.mjs; revisar antes de aplicar.
-- Una sola transacción: si producción no está exactamente como se espera (o ya como quedaría),
-- no cambia nada. No toca el estado de ninguna plataforma, así que no registra cambios de estado
-- ni avisos; el disparador de siempre pone actualizada_el = now() en las filas que cambian.
begin isolation level serializable;
do $guarda$
declare actual uuid; retirada boolean; antes boolean; despues boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is distinct from 'f2732257-206d-48ce-2067-c7e19fa33002'::uuid then
    raise exception 'Publicación distinta de la revisión prevista (2026-11-03.7): %. No aplicar esta entrega.', actual;
  end if;
  if not exists (select 1 from rwadar_catalogo.revisiones where id = 'f2732257-206d-48ce-2067-c7e19fa33002'::uuid
    and contenido_sha256 = 'f2732257206d48ce2067c7e19fa3300202a22060ffcda457d2aea8f6d20da7a9' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar esta entrega.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: esta entrega no autoriza reactivarlo.';
  end if;
  perform 1 from public.plataformas where slug in ('reental', 'toucan-protocol', 'realt') for update;
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
      and motivo_descarte in ('Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.', 'En julio de 2025, Detroit demandó a RealT, a sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles residenciales que, según la demanda, incumplían las normas de construcción, salud y seguridad. Ese mismo mes, una orden judicial provisional le prohibió cobrar alquileres en sus inmuebles hasta que tuvieran certificado de cumplimiento y le ordenó corregir las infracciones. En julio de 2026, su cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en liquidación voluntaria y que iban a vender todos sus activos. RealT había vendido en tokens participaciones de unos 700 inmuebles de Detroit.')) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', 'realt', 'motivo_descarte';
  end if;
  if not ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'toucan-protocol') = 3
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'toucan-protocol'
        except select * from (values ('https://www.spglobal.com/commodity-insights/en/news-research/latest-news/energy-transition/052522-as-verra-halts-tokenization-of-carbon-credits-toucan-vows-to-keep-web3-ethos-alive', 'S&P Global · Verra detiene la tokenización de créditos de carbono'), ('https://carboncredits.com/verra-suspension-carbon-credits-proposes-immobilizing-credits/', 'CarbonCredits · Verra prohíbe tokenizar créditos retirados y propone inmovilizarlos'), ('https://blog.toucan.earth/response-to-verras-announcement/', 'Toucan · su propia respuesta al anuncio de Verra')) as v(url, titulo))) then
    raise exception 'Fuentes de Toucan (dirección o título) distintas de las previstas: no aplicar.';
  end if;
  if not (((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt') = 3
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt'
        except select * from (values ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token'), ('https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones'), ('https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar')) as v(url, titulo)))
      or ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt') = 4
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt'
        except select * from (values ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token'), ('https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones'), ('https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar'), ('https://outliermedia.org/realt-crypto-real-estate-detroit-properties/', 'Outlier Media · RealT planea vender sus inmuebles de Detroit')) as v(url, titulo))
      and exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug = 'realt' and f.url = 'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/' and f.titulo = 'Outlier Media · RealT planea vender sus inmuebles de Detroit'
          and f.publicada_el = '2026-07-16'::date and f.consultada_el = '2026-11-04'::date))) then
    raise exception 'Fuentes de RealT (dirección, título o fechas de la nueva) distintas de las previstas: no aplicar.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> 4 then
    raise exception 'Tiene que haber exactamente 4 descartadas: no aplicar.';
  end if;
  -- Todo como antes o todo ya como quedaría; nada a medias.
  antes := (select nota from public.plataformas where slug = 'reental') = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.'
      and (select motivo_descarte from public.plataformas where slug = 'toucan-protocol') = 'El bloqueo no es suyo sino del registro: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.'
      and (select etiqueta_descarte from public.plataformas where slug = 'realt') = 'En liquidación'
      and (select motivo_descarte from public.plataformas where slug = 'realt') = 'Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.'
      and ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt') = 3
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt'
        except select * from (values ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token'), ('https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones'), ('https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar')) as v(url, titulo)));
  despues := (select nota from public.plataformas where slug = 'reental') = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €.'
      and (select motivo_descarte from public.plataformas where slug = 'toucan-protocol') = 'El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.'
      and (select etiqueta_descarte from public.plataformas where slug = 'realt') = 'Liquidación anunciada'
      and (select motivo_descarte from public.plataformas where slug = 'realt') = 'En julio de 2025, Detroit demandó a RealT, a sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles residenciales que, según la demanda, incumplían las normas de construcción, salud y seguridad. Ese mismo mes, una orden judicial provisional le prohibió cobrar alquileres en sus inmuebles hasta que tuvieran certificado de cumplimiento y le ordenó corregir las infracciones. En julio de 2026, su cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en liquidación voluntaria y que iban a vender todos sus activos. RealT había vendido en tokens participaciones de unos 700 inmuebles de Detroit.'
      and ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt') = 4
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt'
        except select * from (values ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token'), ('https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones'), ('https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar'), ('https://outliermedia.org/realt-crypto-real-estate-detroit-properties/', 'Outlier Media · RealT planea vender sus inmuebles de Detroit')) as v(url, titulo))
      and exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug = 'realt' and f.url = 'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/' and f.titulo = 'Outlier Media · RealT planea vender sus inmuebles de Detroit'
          and f.publicada_el = '2026-07-16'::date and f.consultada_el = '2026-11-04'::date));
  if not (coalesce(antes, false) or coalesce(despues, false)) then
    raise exception 'Textos y fuentes a medias entre lo anterior y lo nuevo: no aplicar.';
  end if;
end $guarda$;
update public.plataformas set nota = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €.' where slug = 'reental' and nota = 'Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.';
update public.plataformas set motivo_descarte = 'El bloqueo no viene de Toucan, sino de los registros de carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.' where slug = 'toucan-protocol' and motivo_descarte = 'El bloqueo no es suyo sino del registro: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra como el American Carbon Registry suspendieron la tokenización desde sus registros. Verra estudia un estado «inmovilizado» que la permitiría, todavía sin resolver. Toucan respaldó públicamente la decisión.';
update public.plataformas set etiqueta_descarte = 'Liquidación anunciada' where slug = 'realt' and etiqueta_descarte = 'En liquidación';
update public.plataformas set motivo_descarte = 'En julio de 2025, Detroit demandó a RealT, a sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles residenciales que, según la demanda, incumplían las normas de construcción, salud y seguridad. Ese mismo mes, una orden judicial provisional le prohibió cobrar alquileres en sus inmuebles hasta que tuvieran certificado de cumplimiento y le ordenó corregir las infracciones. En julio de 2026, su cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en liquidación voluntaria y que iban a vender todos sus activos. RealT había vendido en tokens participaciones de unos 700 inmuebles de Detroit.' where slug = 'realt' and motivo_descarte = 'Detroit la demandó junto a sus 165 sociedades por más de 400 viviendas con infracciones, en la mayor demanda por insalubridad de la historia de la ciudad. Un juez le prohibió cobrar alquileres en las no conformes y le ordenó reparar. En julio de 2026 la propia empresa anunció liquidación voluntaria y la venta de sus más de 700 inmuebles en Detroit.';
insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/','Outlier Media · RealT planea vender sus inmuebles de Detroit','2026-07-16'::date,'2026-11-04'::date from public.plataformas where slug = 'realt' on conflict (plataforma_id,url) do nothing;
do $comprobar$
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
  if (select motivo_descarte from public.plataformas where slug = 'realt') is distinct from 'En julio de 2025, Detroit demandó a RealT, a sus dos cofundadores y a 165 sociedades vinculadas por más de 400 inmuebles residenciales que, según la demanda, incumplían las normas de construcción, salud y seguridad. Ese mismo mes, una orden judicial provisional le prohibió cobrar alquileres en sus inmuebles hasta que tuvieran certificado de cumplimiento y le ordenó corregir las infracciones. En julio de 2026, su cofundador Jean-Marc Jacobson dijo a los inversores que la empresa entraba en liquidación voluntaria y que iban a vender todos sus activos. RealT había vendido en tokens participaciones de unos 700 inmuebles de Detroit.' then
    raise exception 'No quedó el texto nuevo de % (%).', 'realt', 'motivo_descarte';
  end if;
  if not ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt') = 4
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'realt'
        except select * from (values ('https://detroitmi.gov/news/city-scores-major-win-tenants-living-troubled-real-token-properties-are-subject-sweeping-lawsuit', 'Ciudad de Detroit · la ciudad gana una medida para los inquilinos de Real Token'), ('https://www.bridgedetroit.com/detroit-sues-blockchain-real-estate-firm/', 'BridgeDetroit · Detroit demanda a Real Token por cientos de infracciones'), ('https://www.bridgedetroit.com/real-token-detroit-rent-repairs/', 'BridgeDetroit · un juez prohíbe a Real Token cobrar alquileres y ordena reparar'), ('https://outliermedia.org/realt-crypto-real-estate-detroit-properties/', 'Outlier Media · RealT planea vender sus inmuebles de Detroit')) as v(url, titulo))
      and exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug = 'realt' and f.url = 'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/' and f.titulo = 'Outlier Media · RealT planea vender sus inmuebles de Detroit'
          and f.publicada_el = '2026-07-16'::date and f.consultada_el = '2026-11-04'::date)) then
    raise exception 'RealT no quedó con sus 4 fuentes previstas.';
  end if;
  if not ((select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'toucan-protocol') = 3
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = 'toucan-protocol'
        except select * from (values ('https://www.spglobal.com/commodity-insights/en/news-research/latest-news/energy-transition/052522-as-verra-halts-tokenization-of-carbon-credits-toucan-vows-to-keep-web3-ethos-alive', 'S&P Global · Verra detiene la tokenización de créditos de carbono'), ('https://carboncredits.com/verra-suspension-carbon-credits-proposes-immobilizing-credits/', 'CarbonCredits · Verra prohíbe tokenizar créditos retirados y propone inmovilizarlos'), ('https://blog.toucan.earth/response-to-verras-announcement/', 'Toucan · su propia respuesta al anuncio de Verra')) as v(url, titulo))) then
    raise exception 'Las fuentes de Toucan cambiaron.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> 4 then
    raise exception 'Tiene que haber exactamente 4 descartadas.';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from 'f2732257-206d-48ce-2067-c7e19fa33002'::uuid then
    raise exception 'La revisión publicada cambió.';
  end if;
end $comprobar$;
commit;
