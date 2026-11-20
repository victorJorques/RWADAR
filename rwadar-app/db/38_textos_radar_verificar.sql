-- =====================================================================
-- RWAdar · 38 · comprobar los textos del radar (solo lee)
-- ---------------------------------------------------------------------
-- Cada columna de cada plataforma de la 38 tiene su texto nuevo. Si no,
-- raise con la lista de lo que no cuadra. Termina en rollback: no cambia
-- nada.
-- =====================================================================
begin transaction read only;

do $verificar$
declare
  esperado record;
  actual text;
  mal text[] := '{}';
  plataformas int;
begin
  for esperado in
    select * from (values
    ('swarm', 'aval', 'La contraparte es Swarm Capital GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base de datos (20/11/2026) y su aviso legal no nombra supervisor.'),
    ('swarm', 'nota', 'Acciones y bonos tokenizados. Se contrata con una sociedad de Liechtenstein; sus términos eligen la ley alemana.'),
    ('swarm', 'region_slug', 'liechtenstein'),
    ('inx', 'aval', 'INX Securities, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Desde 11/2025 pertenece a OpenDeal, Inc. (Republic), que según FINRA no es una sociedad cotizada.'),
    ('inx', 'nota', 'Plataforma de valores digitales con negociación secundaria.'),
    ('superstate', 'aval', 'Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad de inversión. Superstate Services es agente de transferencias registrado ante la SEC.'),
    ('superstate', 'cadenas', 'Ethereum, Solana, Plume'),
    ('pax-gold', 'aval', 'Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC, con atestaciones mensuales del oro.'),
    ('pax-gold', 'cadenas', 'Ethereum, Solana, Base'),
    ('midas', 'aval', 'Emite bajo un folleto base aprobado por la FMA de Liechtenstein el 17/07/2026 y notificado a la CNMV. Aprobar el folleto no es una licencia: según el propio folleto, el emisor no está regulado por la FMA.'),
    ('midas', 'nota', 'Certificados tokenizados sobre estrategias de renta fija.'),
    ('blocksquare', 'aval', 'Cada token se apoya en un acuerdo societario del emisor, guardado en IPFS, que identifica el inmueble con sus datos registrales y le obliga frente a los tenedores. No es una inscripción en el registro de la propiedad.'),
    ('blocksquare', 'nota', 'Tecnología para que una inmobiliaria tokenice sus propios activos.'),
    ('lofty', 'aval', 'Según sus términos, Lofty no está registrada ante la SEC ni ante ningún otro organismo, y no es un bróker-dealer registrado. Su mercado no es una oferta registrada.'),
    ('franklin-templeton', 'aval', 'Fondo monetario estadounidense (FOBXX). Solo para residentes en EE. UU.: su folleto del 01/08/2026 dice que no está registrado ni puede ofrecerse en ningún país de la UE o del EEE.'),
    ('reental', 'aval', 'Según su web, es una empresa norteamericana que ofrece inversiones desde EE. UU. y España, y su actividad no está sujeta a autorización ni registro previo de la CNMV: no hay un supervisor que la vigile.'),
    ('spiko', 'aval', 'Fondos monetarios de la SICAV francesa Spiko SICAV, gestionados por Twenty First Capital. No todos aparecen hoy en la base pública de la AMF: compruébalo fondo a fondo.'),
    ('spiko', 'nota', 'Fondos en euros y dólares para la tesorería de empresas y particulares, con reembolso diario.'),
    ('spiko', 'acceso', 'Minorista'),
    ('backed-finance', 'aval', 'Grupo suizo; los xStocks los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo 1:1 en custodios regulados y prueba de reservas pública.'),
    ('backed-finance', 'nota', 'Réplicas tokenizadas de acciones y bonos cotizados.'),
    ('addx', 'aval', 'Licencia de mercado reconocido del MAS de Singapur. Accionistas de su matriz: la bolsa SGX, Heliconia (del grupo Temasek), UOB y otros.'),
    ('maple-finance', 'aval', 'Su crédito institucional es para inversores acreditados que completan el alta (KYC/AML); syrupUSDC y syrupUSDT están abiertos a cualquiera en cadena fuera de EE. UU. Los términos de esa interfaz dicen que la operadora no está registrada ante ningún regulador.'),
    ('maple-finance', 'nota', 'Crédito privado para instituciones y productos de rendimiento en cadena (syrupUSDC y syrupUSDT).'),
    ('securitize', 'aval', 'Su filial Securitize Markets, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras filiales.'),
    ('securitize', 'nota', 'Plataforma de tokenización, administración y negociación de valores; cada función la lleva una sociedad distinta del grupo.'),
    ('courtyard', 'aval', 'Es un mercado de NFT de coleccionables físicos, no un mercado de valores con licencia. No hemos podido comprobar hoy en su web la custodia ni el canje.'),
    ('courtyard', 'nota', 'Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados.'),
    ('ondo-finance', 'aval', 'En el EEE, USDY exige ser cliente profesional o inversor cualificado. Emisor, producto y jurisdicción se revisan por separado: no hay una licencia única para toda la marca.'),
    ('centrifuge', 'aval', 'Es un protocolo, no el emisor: cada fondo tiene su propio vehículo, jurisdicción y documento de oferta. Sus términos dicen que los productos pueden no estar regulados.'),
    ('centrifuge', 'nota', 'Financiación de carteras de préstamos y facturas con garantía fuera de cadena.'),
    ('fireblocks', 'aval', 'Fireblocks Trust Company, LLC figura en el NYDFS como trust de propósito limitado. Esa licencia es de esa sociedad, no de todo su software.'),
    ('fireblocks', 'nota', 'Software de custodia y emisión de activos digitales para empresas e instituciones.'),
    ('figure', 'aval', 'Figure Securities, Inc. es bróker-dealer registrado ante la SEC (FINRA, CRD 307093) y opera un ATS. Ese registro no cubre a las demás sociedades de Figure.'),
    ('tzero', 'aval', 'tZERO Securities, LLC es bróker-dealer registrado en FINRA y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras sociedades.'),
    ('tzero', 'nota', 'Mercado secundario en EE. UU. para valores emitidos en cadena.'),
    ('tokeny', 'aval', 'Autora del estándar ERC-3643, para tokens con reglas de cumplimiento incorporadas.'),
    ('tokeny', 'nota', 'Capa de cumplimiento normativo para emisores de tokens.'),
    ('domoblock', 'motivo_descarte', 'La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables.'),
    ('toucan-protocol', 'etiqueta_descarte', 'Registro bloqueado en 2022'),
    ('toucan-protocol', 'motivo_descarte', 'En mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Hoy Toucan solo tokeniza créditos del registro Puro (su fondo CHAR, de biocarbón), con los créditos inmovilizados en ese registro. No la hemos vuelto a evaluar para el radar.')
    ) as e(slug, columna, valor)
  loop
    execute format('select %I::text from public.plataformas where slug = $1', esperado.columna)
      into actual using esperado.slug;
    if actual is distinct from esperado.valor then
      mal := mal || (esperado.slug || '.' || esperado.columna);
    end if;
  end loop;
  if cardinality(mal) > 0 then
    raise exception 'RWAdar 38: textos sin corregir: %', array_to_string(mal, ', ');
  end if;
  select count(distinct slug) into plataformas from (values
    ('swarm'),
    ('inx'),
    ('superstate'),
    ('pax-gold'),
    ('midas'),
    ('blocksquare'),
    ('lofty'),
    ('franklin-templeton'),
    ('reental'),
    ('spiko'),
    ('backed-finance'),
    ('addx'),
    ('maple-finance'),
    ('securitize'),
    ('courtyard'),
    ('ondo-finance'),
    ('centrifuge'),
    ('fireblocks'),
    ('figure'),
    ('tzero'),
    ('tokeny'),
    ('domoblock'),
    ('toucan-protocol')
  ) as p(slug) where exists (select 1 from public.plataformas x where x.slug = p.slug);
  if plataformas <> 23 then
    raise exception 'RWAdar 38: faltan plataformas (% de 23)', plataformas;
  end if;
  raise notice 'RWAdar 38 OK: % plataformas', plataformas;
end
$verificar$;

rollback;
