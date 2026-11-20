-- =====================================================================
-- RWAdar · 38 · textos del radar corregidos (tabla base public.plataformas)
-- ---------------------------------------------------------------------
-- Orden de la dirección del 20/11/2026 (17:40 UTC): «Todo lo falso fuera…
-- que no vuelvan a haber textos ni datos falsos». La auditoría de hoy
-- (data/verificaciones/2026-11-20-v2/auditoria/radar-plataformas.md y
-- sitio-web.md) encontró falsos o sin fuente textos de julio y agosto de
-- los campos aval, nota, acceso, cadenas y región (y el motivo de dos
-- descartadas). Antes, ahora y fuente de cada cambio: TEXTOS-RADAR.md y
-- textos-radar.json, en esa misma carpeta.
--
-- Una transacción. Por plataforma, una guarda y un UPDATE solo de sus
-- columnas: si alguna columna no tiene ni el texto de antes ni el nuevo,
-- raise y no queda nada. Si ya tiene el nuevo, el UPDATE no toca la fila
-- (se puede repetir). No cambia ni ofertas, ni fuentes, ni la revisión
-- del catálogo.
--
-- Se aplica con «Textos del radar (base)» (textos-radar-base.yml).
-- Comprobación: 38_textos_radar_verificar.sql.
-- =====================================================================
begin;

-- swarm: aval, nota, region_slug
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'swarm') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma swarm';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'swarm' and
      (aval::text is not distinct from 'Opera bajo licencia de intermediación financiera de BaFin, el regulador alemán, con respaldo 1:1 verificable.' or aval::text is not distinct from 'Según sus términos, la contraparte es Swarm Capital GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base de datos (20/11/2026) y su aviso legal no nombra supervisor.')
      and (nota::text is not distinct from 'Acciones y bonos tokenizados negociables dentro del marco regulatorio alemán.' or nota::text is not distinct from 'Acciones y bonos tokenizados. Sus términos designan como contraparte a una sociedad de Liechtenstein y eligen la ley alemana.')
      and (region_slug::text is not distinct from 'union-europea' or region_slug::text is not distinct from 'liechtenstein')) then
    raise exception 'RWAdar 38: swarm no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Según sus términos, la contraparte es Swarm Capital GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base de datos (20/11/2026) y su aviso legal no nombra supervisor.',
       nota = 'Acciones y bonos tokenizados. Sus términos designan como contraparte a una sociedad de Liechtenstein y eligen la ley alemana.',
       region_slug = 'liechtenstein'
 where slug = 'swarm'
   and (aval::text is distinct from 'Según sus términos, la contraparte es Swarm Capital GmbH (Vaduz, Liechtenstein). No consta licencia: BaFin no la tiene en su base de datos (20/11/2026) y su aviso legal no nombra supervisor.'
    or nota::text is distinct from 'Acciones y bonos tokenizados. Sus términos designan como contraparte a una sociedad de Liechtenstein y eligen la ley alemana.'
    or region_slug::text is distinct from 'liechtenstein');

-- inx: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'inx') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma inx';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'inx' and
      (aval::text is not distinct from 'Bróker-dealer registrado ante la SEC y miembro de FINRA; su matriz cotiza en Nasdaq.' or aval::text is not distinct from 'INX Securities, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Desde 11/2025 pertenece a OpenDeal, Inc. (Republic), que según FINRA no es una sociedad cotizada.')
      and (nota::text is not distinct from 'Plataforma regulada de valores digitales con negociación secundaria abierta a minoristas.' or nota::text is not distinct from 'Plataforma de valores digitales con negociación secundaria.')) then
    raise exception 'RWAdar 38: inx no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'INX Securities, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Desde 11/2025 pertenece a OpenDeal, Inc. (Republic), que según FINRA no es una sociedad cotizada.',
       nota = 'Plataforma de valores digitales con negociación secundaria.'
 where slug = 'inx'
   and (aval::text is distinct from 'INX Securities, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Desde 11/2025 pertenece a OpenDeal, Inc. (Republic), que según FINRA no es una sociedad cotizada.'
    or nota::text is distinct from 'Plataforma de valores digitales con negociación secundaria.');

-- superstate: aval, cadenas
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'superstate') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma superstate';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'superstate' and
      (aval::text is not distinct from 'Fondos estadounidenses registrados con administrador y auditor independientes; fundada por un antiguo responsable de Compound.' or aval::text is not distinct from 'Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad de inversión. Superstate Services es agente de transferencias registrado ante la SEC.')
      and (cadenas::text is not distinct from 'Ethereum' or cadenas::text is not distinct from 'Ethereum, Solana, Plume')) then
    raise exception 'RWAdar 38: superstate no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad de inversión. Superstate Services es agente de transferencias registrado ante la SEC.',
       cadenas = 'Ethereum, Solana, Plume'
 where slug = 'superstate'
   and (aval::text is distinct from 'Fondo privado estadounidense (USTB, gestionado por Invesco Advisers), con auditor (PwC) y custodio (BNY) independientes; no está registrado como sociedad de inversión. Superstate Services es agente de transferencias registrado ante la SEC.'
    or cadenas::text is distinct from 'Ethereum, Solana, Plume');

-- pax-gold: aval, cadenas
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'pax-gold') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma pax-gold';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'pax-gold' and
      (aval::text is not distinct from 'Emitido por Paxos bajo supervisión del regulador bancario de Nueva York (NYDFS), con atestaciones mensuales del oro asignado.' or aval::text is not distinct from 'Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC, con atestaciones mensuales del oro.')
      and (cadenas::text is not distinct from 'Ethereum' or cadenas::text is not distinct from 'Ethereum, Solana, Base')) then
    raise exception 'RWAdar 38: pax-gold no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC, con atestaciones mensuales del oro.',
       cadenas = 'Ethereum, Solana, Base'
 where slug = 'pax-gold'
   and (aval::text is distinct from 'Lo emite Paxos Trust Company, N.A., banco fiduciario nacional de EE. UU. supervisado por la OCC, con atestaciones mensuales del oro.'
    or cadenas::text is distinct from 'Ethereum, Solana, Base');

-- midas: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'midas') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma midas';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'midas' and
      (aval::text is not distinct from 'Emite bajo folleto aprobado en la Unión Europea, lo que obliga a información periódica y responsabilidad del emisor.' or aval::text is not distinct from 'Emite bajo un folleto base aprobado por la FMA de Liechtenstein el 17/07/2026 y notificado a la CNMV. Aprobar el folleto no es una licencia: según el propio folleto, el emisor no está regulado por la FMA.')
      and (nota::text is not distinct from 'Certificados tokenizados sobre estrategias de renta fija. Levantó 50 M$ con Franklin Templeton y Coinbase Ventures.' or nota::text is not distinct from 'Certificados tokenizados sobre estrategias de renta fija.')) then
    raise exception 'RWAdar 38: midas no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Emite bajo un folleto base aprobado por la FMA de Liechtenstein el 17/07/2026 y notificado a la CNMV. Aprobar el folleto no es una licencia: según el propio folleto, el emisor no está regulado por la FMA.',
       nota = 'Certificados tokenizados sobre estrategias de renta fija.'
 where slug = 'midas'
   and (aval::text is distinct from 'Emite bajo un folleto base aprobado por la FMA de Liechtenstein el 17/07/2026 y notificado a la CNMV. Aprobar el folleto no es una licencia: según el propio folleto, el emisor no está regulado por la FMA.'
    or nota::text is distinct from 'Certificados tokenizados sobre estrategias de renta fija.');

-- blocksquare: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'blocksquare') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma blocksquare';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'blocksquare' and
      (aval::text is not distinct from 'Vincula cada token a una anotación en el registro de la propiedad, no solo a un contrato inteligente.' or aval::text is not distinct from 'Cada token se apoya en un acuerdo societario del emisor, guardado en IPFS, que identifica el inmueble con sus datos registrales y le obliga frente a los tenedores. No es una inscripción en el registro de la propiedad.')
      and (nota::text is not distinct from 'Tecnología para que una inmobiliaria tokenice sus propios activos con respaldo registral.' or nota::text is not distinct from 'Tecnología para que una inmobiliaria tokenice sus propios activos.')) then
    raise exception 'RWAdar 38: blocksquare no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Cada token se apoya en un acuerdo societario del emisor, guardado en IPFS, que identifica el inmueble con sus datos registrales y le obliga frente a los tenedores. No es una inscripción en el registro de la propiedad.',
       nota = 'Tecnología para que una inmobiliaria tokenice sus propios activos.'
 where slug = 'blocksquare'
   and (aval::text is distinct from 'Cada token se apoya en un acuerdo societario del emisor, guardado en IPFS, que identifica el inmueble con sus datos registrales y le obliga frente a los tenedores. No es una inscripción en el registro de la propiedad.'
    or nota::text is distinct from 'Tecnología para que una inmobiliaria tokenice sus propios activos.');

-- lofty: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'lofty') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma lofty';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'lofty' and
      (aval::text is not distinct from 'Estructura de LLC por inmueble con oferta registrada; una de las pocas vías reales de entrada minorista al inmobiliario tokenizado.' or aval::text is not distinct from 'Según sus términos, Lofty no está registrada ante la SEC ni ante ningún otro organismo, y según su web no es un bróker-dealer registrado. Su mercado no es una oferta registrada.')) then
    raise exception 'RWAdar 38: lofty no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Según sus términos, Lofty no está registrada ante la SEC ni ante ningún otro organismo, y según su web no es un bróker-dealer registrado. Su mercado no es una oferta registrada.'
 where slug = 'lofty'
   and (aval::text is distinct from 'Según sus términos, Lofty no está registrada ante la SEC ni ante ningún otro organismo, y según su web no es un bróker-dealer registrado. Su mercado no es una oferta registrada.');

-- franklin-templeton: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'franklin-templeton') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma franklin-templeton';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'franklin-templeton' and
      (aval::text is not distinct from 'Gestora tradicional con décadas de historial y fondo registrado ante la SEC. La vía más conservadora para empezar.' or aval::text is not distinct from 'Fondo monetario estadounidense (FOBXX). Solo para residentes en EE. UU.: su folleto del 01/08/2026 dice que no está registrado ni puede ofrecerse en ningún país de la UE o del EEE.')) then
    raise exception 'RWAdar 38: franklin-templeton no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Fondo monetario estadounidense (FOBXX). Solo para residentes en EE. UU.: su folleto del 01/08/2026 dice que no está registrado ni puede ofrecerse en ningún país de la UE o del EEE.'
 where slug = 'franklin-templeton'
   and (aval::text is distinct from 'Fondo monetario estadounidense (FOBXX). Solo para residentes en EE. UU.: su folleto del 01/08/2026 dice que no está registrado ni puede ofrecerse en ningún país de la UE o del EEE.');

-- reental: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'reental') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma reental';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'reental' and
      (aval::text is not distinct from 'Historial de proyectos completados y devueltos, con cientos de reseñas públicas verificadas de inversores.' or aval::text is not distinct from 'Según su web, es una empresa norteamericana que ofrece inversiones desde EE. UU. y España, y su actividad en España no está sujeta a autorización ni registro previo de la CNMV.')) then
    raise exception 'RWAdar 38: reental no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Según su web, es una empresa norteamericana que ofrece inversiones desde EE. UU. y España, y su actividad en España no está sujeta a autorización ni registro previo de la CNMV.'
 where slug = 'reental'
   and (aval::text is distinct from 'Según su web, es una empresa norteamericana que ofrece inversiones desde EE. UU. y España, y su actividad en España no está sujeta a autorización ni registro previo de la CNMV.');

-- spiko: aval, nota, acceso
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'spiko') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma spiko';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'spiko' and
      (aval::text is not distinct from 'Fondos monetarios autorizados y supervisados por la AMF, el regulador financiero francés. Marco europeo completo.' or aval::text is not distinct from 'Fondos monetarios de la SICAV francesa Spiko SICAV, gestionados por Twenty First Capital. No todos aparecían el 20/11/2026 en la base pública de la AMF: compruébalo fondo a fondo.')
      and (nota::text is not distinct from 'Fondos en euros y dólares pensados para la tesorería de empresas, con reembolso diario.' or nota::text is not distinct from 'Fondos en euros y dólares para la tesorería de empresas y particulares, con reembolso diario.')
      and (acceso::text is not distinct from 'Empresas' or acceso::text is not distinct from 'Minorista')) then
    raise exception 'RWAdar 38: spiko no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Fondos monetarios de la SICAV francesa Spiko SICAV, gestionados por Twenty First Capital. No todos aparecían el 20/11/2026 en la base pública de la AMF: compruébalo fondo a fondo.',
       nota = 'Fondos en euros y dólares para la tesorería de empresas y particulares, con reembolso diario.',
       acceso = 'Minorista'
 where slug = 'spiko'
   and (aval::text is distinct from 'Fondos monetarios de la SICAV francesa Spiko SICAV, gestionados por Twenty First Capital. No todos aparecían el 20/11/2026 en la base pública de la AMF: compruébalo fondo a fondo.'
    or nota::text is distinct from 'Fondos en euros y dólares para la tesorería de empresas y particulares, con reembolso diario.'
    or acceso::text is distinct from 'Minorista');

-- backed-finance: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'backed-finance') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma backed-finance';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'backed-finance' and
      (aval::text is not distinct from 'Emisor suizo con el activo real depositado 1:1 en custodia de un tercero y atestaciones públicas de respaldo.' or aval::text is not distinct from 'Los xStocks los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo 1:1 en custodios regulados y prueba de reservas pública.')
      and (nota::text is not distinct from 'Réplicas tokenizadas de acciones y bonos cotizados, activas desde 2021.' or nota::text is not distinct from 'Réplicas tokenizadas de acciones y bonos cotizados.')) then
    raise exception 'RWAdar 38: backed-finance no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Los xStocks los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo 1:1 en custodios regulados y prueba de reservas pública.',
       nota = 'Réplicas tokenizadas de acciones y bonos cotizados.'
 where slug = 'backed-finance'
   and (aval::text is distinct from 'Los xStocks los emite una sociedad de Jersey (Backed Assets (JE) Limited), con el activo 1:1 en custodios regulados y prueba de reservas pública.'
    or nota::text is distinct from 'Réplicas tokenizadas de acciones y bonos cotizados.');

-- addx: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'addx') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma addx';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'addx' and
      (aval::text is not distinct from 'Licencia de mercado reconocido del MAS de Singapur; accionistas de referencia: la bolsa SGX y el fondo estatal Temasek.' or aval::text is not distinct from 'Licencia de mercado reconocido del MAS de Singapur. Accionistas de su matriz: la bolsa SGX, Heliconia, UOB y otros.')) then
    raise exception 'RWAdar 38: addx no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Licencia de mercado reconocido del MAS de Singapur. Accionistas de su matriz: la bolsa SGX, Heliconia, UOB y otros.'
 where slug = 'addx'
   and (aval::text is distinct from 'Licencia de mercado reconocido del MAS de Singapur. Accionistas de su matriz: la bolsa SGX, Heliconia, UOB y otros.');

-- maple-finance: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'maple-finance') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma maple-finance';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'maple-finance' and
      (aval::text is not distinct from 'Cifras auditadas y publicadas cada trimestre en formato de resultados; crédito institucional integrado con Robinhood y Kraken.' or aval::text is not distinct from 'Su crédito institucional es para inversores acreditados que completan el alta (KYC/AML). Maple dice que syrupUSDC y syrupUSDT están abiertos en cadena fuera de EE. UU., pero los términos de esa interfaz excluyen además otras jurisdicciones y dicen que la operadora no está registrada ante ningún regulador.')
      and (nota::text is not distinct from 'El mayor actor del crédito privado tokenizado: cerró el primer semestre de 2026 con 4.600 M$ gestionados (+81 % interanual) y 1.900 M$ en préstamos vivos.' or nota::text is not distinct from 'Crédito privado para instituciones y productos de rendimiento en cadena (syrupUSDC y syrupUSDT).')) then
    raise exception 'RWAdar 38: maple-finance no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Su crédito institucional es para inversores acreditados que completan el alta (KYC/AML). Maple dice que syrupUSDC y syrupUSDT están abiertos en cadena fuera de EE. UU., pero los términos de esa interfaz excluyen además otras jurisdicciones y dicen que la operadora no está registrada ante ningún regulador.',
       nota = 'Crédito privado para instituciones y productos de rendimiento en cadena (syrupUSDC y syrupUSDT).'
 where slug = 'maple-finance'
   and (aval::text is distinct from 'Su crédito institucional es para inversores acreditados que completan el alta (KYC/AML). Maple dice que syrupUSDC y syrupUSDT están abiertos en cadena fuera de EE. UU., pero los términos de esa interfaz excluyen además otras jurisdicciones y dicen que la operadora no está registrada ante ningún regulador.'
    or nota::text is distinct from 'Crédito privado para instituciones y productos de rendimiento en cadena (syrupUSDC y syrupUSDT).');

-- securitize: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'securitize') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma securitize';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'securitize' and
      (aval::text is not distinct from 'Agente de transferencia registrado ante la SEC. Es quien emite y administra el fondo tokenizado BUIDL de BlackRock.' or aval::text is not distinct from 'Su filial Securitize Markets, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras filiales.')
      and (nota::text is not distinct from 'La infraestructura sobre la que las grandes gestoras sacan sus fondos a la cadena. El nombre más institucional del sector.' or nota::text is not distinct from 'Plataforma de tokenización, administración y negociación de valores; cada función la lleva una sociedad distinta del grupo.')) then
    raise exception 'RWAdar 38: securitize no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Su filial Securitize Markets, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras filiales.',
       nota = 'Plataforma de tokenización, administración y negociación de valores; cada función la lleva una sociedad distinta del grupo.'
 where slug = 'securitize'
   and (aval::text is distinct from 'Su filial Securitize Markets, LLC es bróker-dealer registrado ante la SEC, miembro de FINRA, y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras filiales.'
    or nota::text is distinct from 'Plataforma de tokenización, administración y negociación de valores; cada función la lleva una sociedad distinta del grupo.');

-- courtyard: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'courtyard') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma courtyard';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'courtyard' and
      (aval::text is not distinct from 'El objeto físico se guarda en cámara asegurada y el token es canjeable por él en cualquier momento: respaldo comprobable.' or aval::text is not distinct from 'Es un mercado de NFT de coleccionables físicos, no un mercado de valores con licencia. No hemos podido comprobar el 20/11/2026 en su web la custodia ni el canje.')
      and (nota::text is not distinct from 'Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados. Líder por volumen semanal en 2026.' or nota::text is not distinct from 'Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados.')) then
    raise exception 'RWAdar 38: courtyard no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Es un mercado de NFT de coleccionables físicos, no un mercado de valores con licencia. No hemos podido comprobar el 20/11/2026 en su web la custodia ni el canje.',
       nota = 'Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados.'
 where slug = 'courtyard'
   and (aval::text is distinct from 'Es un mercado de NFT de coleccionables físicos, no un mercado de valores con licencia. No hemos podido comprobar el 20/11/2026 en su web la custodia ni el canje.'
    or nota::text is distinct from 'Cromos y coleccionables físicos (cartas Pokémon, deportivas) tokenizados.');

-- ondo-finance: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'ondo-finance') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma ondo-finance';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'ondo-finance' and
      (aval::text is not distinct from 'La mayor plataforma de valores tokenizados por volumen, con los activos subyacentes en custodia de gestoras reguladas.' or aval::text is not distinct from 'En el EEE, USDY exige ser cliente profesional o inversor cualificado. Emisor, producto y jurisdicción se revisan por separado: no consta una licencia única para toda la marca.')) then
    raise exception 'RWAdar 38: ondo-finance no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'En el EEE, USDY exige ser cliente profesional o inversor cualificado. Emisor, producto y jurisdicción se revisan por separado: no consta una licencia única para toda la marca.'
 where slug = 'ondo-finance'
   and (aval::text is distinct from 'En el EEE, USDY exige ser cliente profesional o inversor cualificado. Emisor, producto y jurisdicción se revisan por separado: no consta una licencia única para toda la marca.');

-- centrifuge: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'centrifuge') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma centrifuge';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'centrifuge' and
      (aval::text is not distinct from 'Una de las tres plataformas que concentran dos tercios del crédito privado tokenizado; estructura de tramos senior/junior.' or aval::text is not distinct from 'Es un protocolo, no el emisor: cada fondo tiene su propio vehículo, jurisdicción y documento de oferta. Sus términos dicen que los productos pueden no estar regulados.')
      and (nota::text is not distinct from 'Financiación de carteras de préstamos y facturas con garantía fuera de cadena. Tuvo impagos por 5,8 M$ en 2023 y reforzó su modelo después.' or nota::text is not distinct from 'Financiación de carteras de préstamos y facturas con garantía fuera de cadena.')) then
    raise exception 'RWAdar 38: centrifuge no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Es un protocolo, no el emisor: cada fondo tiene su propio vehículo, jurisdicción y documento de oferta. Sus términos dicen que los productos pueden no estar regulados.',
       nota = 'Financiación de carteras de préstamos y facturas con garantía fuera de cadena.'
 where slug = 'centrifuge'
   and (aval::text is distinct from 'Es un protocolo, no el emisor: cada fondo tiene su propio vehículo, jurisdicción y documento de oferta. Sus términos dicen que los productos pueden no estar regulados.'
    or nota::text is distinct from 'Financiación de carteras de préstamos y facturas con garantía fuera de cadena.');

-- fireblocks: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'fireblocks') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma fireblocks';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'fireblocks' and
      (aval::text is not distinct from 'Custodia institucional con seguros y certificaciones de seguridad, usada por bancos y gestoras de primer nivel.' or aval::text is not distinct from 'Fireblocks Trust Company, LLC figura en el NYDFS como trust de propósito limitado. Esa licencia es de esa sociedad, no de todo su software.')
      and (nota::text is not distinct from 'El motor de custodia y emisión detrás de decenas de proyectos institucionales de tokenización.' or nota::text is not distinct from 'Software de custodia y emisión de activos digitales para empresas e instituciones.')) then
    raise exception 'RWAdar 38: fireblocks no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Fireblocks Trust Company, LLC figura en el NYDFS como trust de propósito limitado. Esa licencia es de esa sociedad, no de todo su software.',
       nota = 'Software de custodia y emisión de activos digitales para empresas e instituciones.'
 where slug = 'fireblocks'
   and (aval::text is distinct from 'Fireblocks Trust Company, LLC figura en el NYDFS como trust de propósito limitado. Esa licencia es de esa sociedad, no de todo su software.'
    or nota::text is distinct from 'Software de custodia y emisión de activos digitales para empresas e instituciones.');

-- figure: aval
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'figure') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma figure';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'figure' and
      (aval::text is not distinct from 'Cotiza en Nasdaq (FIGR): cuentas auditadas, información pública trimestral y supervisión de la SEC como emisor.' or aval::text is not distinct from 'Figure Securities, Inc. es bróker-dealer registrado ante la SEC (FINRA, CRD 307093) y opera un ATS. Ese registro no cubre a las demás sociedades de Figure.')) then
    raise exception 'RWAdar 38: figure no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Figure Securities, Inc. es bróker-dealer registrado ante la SEC (FINRA, CRD 307093) y opera un ATS. Ese registro no cubre a las demás sociedades de Figure.'
 where slug = 'figure'
   and (aval::text is distinct from 'Figure Securities, Inc. es bróker-dealer registrado ante la SEC (FINRA, CRD 307093) y opera un ATS. Ese registro no cubre a las demás sociedades de Figure.');

-- tzero: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'tzero') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma tzero';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'tzero' and
      (aval::text is not distinct from 'Opera un sistema alternativo de negociación (ATS) autorizado por la SEC y supervisado por FINRA.' or aval::text is not distinct from 'tZERO Securities, LLC es bróker-dealer registrado en FINRA y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras sociedades.')
      and (nota::text is not distinct from 'El mercado secundario de referencia en EE. UU. para valores emitidos en cadena.' or nota::text is not distinct from 'Mercado secundario en EE. UU. para valores emitidos en cadena.')) then
    raise exception 'RWAdar 38: tzero no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'tZERO Securities, LLC es bróker-dealer registrado en FINRA y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras sociedades.',
       nota = 'Mercado secundario en EE. UU. para valores emitidos en cadena.'
 where slug = 'tzero'
   and (aval::text is distinct from 'tZERO Securities, LLC es bróker-dealer registrado en FINRA y opera un sistema alternativo de negociación (ATS). Las demás funciones del grupo están en otras sociedades.'
    or nota::text is distinct from 'Mercado secundario en EE. UU. para valores emitidos en cadena.');

-- tokeny: aval, nota
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'tokeny') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma tokeny';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'tokeny' and
      (aval::text is not distinct from 'Autora del estándar ERC-3643, hoy la referencia del sector para tokens con reglas de cumplimiento incorporadas.' or aval::text is not distinct from 'Autora del estándar ERC-3643, para tokens con reglas de cumplimiento incorporadas.')
      and (nota::text is not distinct from 'La capa de cumplimiento normativo que usan decenas de emisores institucionales.' or nota::text is not distinct from 'Capa de cumplimiento normativo para emisores de tokens.')) then
    raise exception 'RWAdar 38: tokeny no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       aval = 'Autora del estándar ERC-3643, para tokens con reglas de cumplimiento incorporadas.',
       nota = 'Capa de cumplimiento normativo para emisores de tokens.'
 where slug = 'tokeny'
   and (aval::text is distinct from 'Autora del estándar ERC-3643, para tokens con reglas de cumplimiento incorporadas.'
    or nota::text is distinct from 'Capa de cumplimiento normativo para emisores de tokens.');

-- domoblock: motivo_descarte
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'domoblock') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma domoblock';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'domoblock' and
      (motivo_descarte::text is not distinct from 'La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables. Antes sus emisiones pasaban por una ESI autorizada; dejó de ser así a partir del proyecto DOMO-VLC-4.' or motivo_descarte::text is not distinct from 'La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables.')) then
    raise exception 'RWAdar 38: domoblock no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       motivo_descarte = 'La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables.'
 where slug = 'domoblock'
   and (motivo_descarte::text is distinct from 'La propia plataforma declara que no está supervisada por la CNMV, que no es una Empresa de Servicios de Inversión y que sus productos no son valores negociables.');

-- toucan-protocol: etiqueta_descarte, motivo_descarte
do $guarda$
begin
  if (select count(*) from public.plataformas where slug = 'toucan-protocol') <> 1 then
    raise exception 'RWAdar 38: no está la plataforma toucan-protocol';
  end if;
  if not exists (select 1 from public.plataformas where slug = 'toucan-protocol' and
      (etiqueta_descarte::text is not distinct from 'Registro bloqueado' or etiqueta_descarte::text is not distinct from 'Registro bloqueado en 2022')
      and (motivo_descarte::text is not distinct from 'El bloqueo no viene de Toucan, sino de los registros de carbono: en mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Verra estudiaba entonces un estado «inmovilizado» que permitiría tokenizarlos. Toucan respaldó públicamente la decisión de Verra.' or motivo_descarte::text is not distinct from 'En mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Hoy Toucan solo tokeniza créditos del registro Puro (su cesta CHAR, de biocarbón), con los créditos inmovilizados en ese registro. No la hemos vuelto a evaluar para el radar.')) then
    raise exception 'RWAdar 38: toucan-protocol no tiene el texto de antes ni el nuevo; no se cambia nada';
  end if;
end
$guarda$;
update public.plataformas set
       etiqueta_descarte = 'Registro bloqueado en 2022',
       motivo_descarte = 'En mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Hoy Toucan solo tokeniza créditos del registro Puro (su cesta CHAR, de biocarbón), con los créditos inmovilizados en ese registro. No la hemos vuelto a evaluar para el radar.'
 where slug = 'toucan-protocol'
   and (etiqueta_descarte::text is distinct from 'Registro bloqueado en 2022'
    or motivo_descarte::text is distinct from 'En mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American Carbon Registry prohibió tokenizar los suyos sin su autorización expresa. Hoy Toucan solo tokeniza créditos del registro Puro (su cesta CHAR, de biocarbón), con los créditos inmovilizados en ese registro. No la hemos vuelto a evaluar para el radar.');

do $fin$
begin
  raise notice 'RWAdar 38 aplicada: 23 plataformas con sus textos nuevos';
end
$fin$;

commit;
