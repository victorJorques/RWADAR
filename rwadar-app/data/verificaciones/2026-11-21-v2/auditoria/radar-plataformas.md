# Auditoría independiente · radar de plataformas · 21/11/2026

Ámbito: las 25 plataformas del radar tal como salen hoy en la web
(`lectura-publica/plataformas-v2.json` de las 17:36 UTC y las páginas
`https://rwadar.pages.dev/plataformas/<slug>` descargadas entre las 20:13:34 y
las 20:13:40 UTC) y las 5 descartadas (`/fuera-del-radar/<slug>`). Hoy el radar
no cambia ningún texto (DECISIONES §1), así que lo que se publica es lo mismo de
ayer con la fecha de revisión del 21/11.

Datos visibles revisados en cada plataforma: nombre, tipo, categoría, región,
blockchains, importe de entrada, resumen (`nota`, la entradilla de la página
propia), «cómo funciona y qué se ha comprobado» (`aval`), actividad, licencia,
acceso, avisos importantes y cada fuente con su enlace y su fecha, más el botón
de la web oficial. En las descartadas: etiqueta, motivo y fuentes.

Cómo se hizo: una petición normal con `curl` (agente por defecto) a las 106
direcciones publicadas (68 fuentes, 25 botones y 13 fuentes de descartadas)
entre las 20:15:10 y las 20:16:07 UTC; las páginas que se pintan con JavaScript
y respondieron 200 se abrieron con Playwright sin trucos (20:17–20:27 UTC); y
22 fuentes primarias extra (docs de xStocks, Centrifuge, Courtyard, Blocksquare,
Ondo y Toucan, condiciones finales de mTBILL, CNMV pasaportes, BaFin, FCA,
permisos de Archax UK, Domoblock) entre las 20:27 y las 20:37 UTC. Ningún 403 se
reintentó con otra herramienta. La ficha desplegable de la portada se abrió con
Playwright a las 20:38 UTC (Pax Gold, Backed Finance y Ondo). Copias en
`/tmp/auditoria-2026-11-21/radar/` (fuera del repositorio).

Resultado: **4 correcciones obligatorias y 8 recomendadas.** El contraste
automático (69/69) mira que cada fuente siga diciendo su literal; no mira la
entradilla, los blockchains ni si la página propia enseña los avisos.

## Obligatorias

1. **Las 25 páginas propias no enseñan los avisos importantes.** La ficha
   desplegable de la portada sí los pone («Avisos importantes»), pero
   `/plataformas/<slug>` no: ninguno de los 25 textos de `alertasCriticas`
   aparece en las páginas descargadas a las 20:13 UTC (por ejemplo, en
   `/plataformas/swarm` falta «No está confirmado que un inversor minorista
   pueda entrar…» y en `/plataformas/lofty`, «Su mercado no es una oferta
   registrada y no garantiza que puedas vender al momento…»). Solo salen sus
   fuentes. Causa: `paginaPlataforma` de `rwadar-fichas.js` usa las fuentes de
   las alertas pero no su `detalle`. Corrección (código, va al PR de la web):
   añadir antes de «Antes de invertir» una sección
   `<h2>Avisos importantes</h2><ul>` con un `<li>` por cada
   `alertasCriticas[].detalle`.
2. **Backed Finance · blockchains «Ethereum, Base, Gnosis».** La documentación
   oficial (docs.backed.fi ya lleva a docs.xstocks.fi, 20:29:18 UTC) dice
   «Issued natively on Ethereum, Solana, Arbitrum, Optimism, BNB Chain, Mantle,
   Ink, HyperEVM, Monad, X Layer, TON, and Tron»; «How xStocks Work» (20:28:42
   UTC) da la misma lista. Ni Base ni Gnosis salen, y falta Solana, la red
   principal. El panel de los bTokens (`defi.backed.fi`) da «Access Restricted»
   desde aquí, así que no hay fuente de hoy para Base y Gnosis. Corregir a:
   «Ethereum, Solana, Arbitrum, BNB Chain y otras».
3. **Ondo Finance · entradilla.** Dice «Exposición a deuda pública de EE. UU.
   y, desde 2026, a ETFs de Franklin Templeton tokenizados». Ninguna fuente lo
   respalda: la única mención de Franklin en ondo.finance (20:19:46 UTC) es una
   cita sobre Ondo Chain, y la página «Available Assets» de su documentación
   (20:33:18 UTC) dice «Investors can currently trade 450+ tokenized stocks and
   ETFs via the Ondo Stocks platform, including the stock of popular companies
   (e.g. Tesla, Nvidia, Figma), indexes (e.g. QQQ, SPY), and fixed income ETFs
   (e.g. TLT, TIP, AGG)». Corregir a: «Deuda pública de EE. UU. tokenizada
   (USDY y OUSG) y más de 450 acciones y ETF de EE. UU. tokenizados (Ondo
   Stocks).»
4. **Midas · acceso y «notificado a la CNMV» sin la fuente que lo dice.** El
   acceso dice «Las condiciones finales de mTBILL (17/07/2026) incluyen España
   entre los países de la oferta pública…», pero su única fuente es el folleto
   base, que solo trae la plantilla «[Luxembourg] [France] [Spain] [Italy]
   [Liechtenstein] [•]». Lo dicen las condiciones finales (CDN de GitBook,
   20:32:06 UTC, SHA-256 `b1e58001…944a`, el mismo de la tarjeta de mTBILL):
   «Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, …» y
   «Prohibition of Sales to EEA Retail Investors: not applicable». Lo mismo con
   «notificado a la CNMV» del aval y de la licencia: el folleto no lo dice; la
   CNMV sí (20:31:57 UTC: «BPWO-84 17/07/2026 … Midas Software GmbH
   LIECHTENSTEIN»). Corrección: añadir como fuente del acceso las «Condiciones
   Finales de mTBILL (17/07/2026)» con la dirección del CDN, y como fuente de la
   licencia «CNMV · Pasaportes recibidos (Midas Software GmbH)»,
   `https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500BB00BN6D2B7C48`.
   Los textos se quedan como están.

## Recomendadas

5. **Courtyard · aval.** «No hemos podido comprobar el 20/11/2026 en su web la
   custodia ni el canje.» Su documentación oficial lo explica (20:30:13 UTC):
   «All collectibles are stored in a secured vault and insured at market
   value» y «All cards are vaulted and insured, and are redeemable worldwide at
   anytime», con KYC y pagando envío e impuestos; sus términos dicen que la
   recompra es «a best-effort offer». Mejor: «Es un mercado de NFT de
   coleccionables físicos, no un mercado de valores con licencia. Según su
   documentación, guarda los objetos asegurados en cámara y se pueden canjear
   tras verificar la identidad, pagando envío e impuestos; su oferta de
   recompra no está garantizada.»
6. **Textos con fecha de ayer en una revisión de hoy.** Swarm: «BaFin no la
   tiene en su base de datos (20/11/2026)»; hoy sigue igual (búsqueda «Swarm»,
   20:35:54 UTC: «Keine Ergebnisse»; el control «Smart» sí da resultados).
   Spiko: «No todos aparecían el 20/11/2026 en la base pública de la AMF»
   (la revisión de Spiko de hoy dice que Smart Cash sigue sin ficha). Cambiar
   las dos fechas a 21/11/2026.
7. **Centrifuge · blockchains y entradilla.** «Ethereum, Base» y «Financiación
   de carteras de préstamos y facturas con garantía fuera de cadena». Su
   documentación (llms.txt, 20:29:40 UTC): «Protocol v3.3 deployed on 14
   networks: Ethereum, Base, Arbitrum, Avalanche, Plume, BNB Smart Chain,
   Optimism, HyperEVM, Monad, Pharos, X Layer, Arc, Solana and Stellar» y
   «Asset managers use it to issue a fund as a token… Centrifuge does not
   originate assets». Mejor: blockchains «Varias (14 redes, entre ellas
   Ethereum y Base)»; entradilla «Infraestructura para que las gestoras emitan
   sus fondos como tokens; Centrifuge no origina los activos.»
8. **Midas · blockchains «Ethereum».** Las condiciones finales de mTBILL:
   «Blockchains Ethereum, Base, Oasis Sapphire, Algorand, Plume, Rootstock,
   Etherlink». Mejor: «Ethereum, Base, Plume y otras».
9. **Ondo · acceso de Ondo Stocks en el EEE.** Su web (20:19:46 UTC) dice que
   el folleto base de Ondo Stocks, aprobado por la FMA de Liechtenstein y
   notificado a varios Estados del EEE, hace «many Ondo Stocks and OIP tokens
   available to both professional and retail investors»; la CNMV tiene
   notificado ese folleto (20:33:38 UTC: «BPWO-89 11/11/2026 … Ondo Global
   Markets (BVI) Limited»). Pero la página de requisitos de Ondo Stocks
   (20:33:49 UTC) sigue pidiendo en el EEE cliente profesional o inversor
   cualificado. La ficha solo habla de USDY y marca «Importe de entrada: Alto».
   Añadir al acceso: «Para Ondo Stocks, su web dice que un folleto aprobado por
   la FMA de Liechtenstein y notificado a la CNMV (BPWO-89, 11/11/2026) abre
   muchos tokens a minoristas del EEE, pero su página de requisitos aún pide
   cliente profesional o inversor cualificado: compruébalo producto a
   producto.»
10. **Reental · entradilla, región y licencia.** Entradilla «España y
    Latinoamérica desde 100 €»; su web (20:15:29 UTC) dice «Reental facilita la
    inversión en el sector inmobiliario español y americano» y sus preguntas
    frecuentes, «The minimum investment is 1 token = 100 euros/dollars»; no sale
    ningún país de Latinoamérica. Región «España», pero la propia web dice
    «Reental es una empresa norteamericana que ofrece inversiones desde Estados
    Unidos y España». La licencia sale como «No verificable» cuando Reental
    declara que su actividad «no está sujeta a autorización ni registro previo
    de la CNMV»: es el caso «sin registro declarado», como Lofty y Maple.
    Mejor: entradilla «Proyectos inmobiliarios en España y EE. UU. desde 100 €
    o 100 $ (1 token).»; región «EE. UU. y España»; estado de la licencia
    `sin_registro_declarado`.
11. **Archax · entradilla y fuentes del aval.** «Mercado regulado de valores
    digitales en Londres»: en España «mercado regulado» es otra figura; su
    página de permisos (20:27:42 UTC) dice «authorised and regulated by the
    FCA as a UK investment firm with permissions to operate a Multilateral
    Trading Facility ("MTF")… FRN 838656… listed on the FCA's Cryptoasset
    Register». Esa página, que respalda el aval, no sale en la ficha, y el
    aviso de los clones no tiene fuente enlazada (la FCA lo tiene: «Website:
    https://archax-eu.com», 20:28 UTC). Mejor: «Sistema multilateral de
    negociación (SMN) de valores digitales en Londres, supervisado por la
    FCA…», y añadir como fuentes `https://uk.archax.com/regulatory-permissions`
    y `https://www.fca.org.uk/news/warnings/archax-eu-clone-fca-authorised-firm`.
12. **Descartadas · fuentes primarias que faltan.** Toucan: «Hoy Toucan solo
    tokeniza créditos del registro Puro…» no lo dice ninguna de sus cuatro
    fuentes (todas de 2022); su documentación sí (20:36:48 UTC: «Puro Carbon
    Bridge: The Puro carbon bridge enables the tokenization of carbon removal
    credits…»): añadir `https://docs.toucan.earth/`. Domoblock: «La propia
    plataforma declara…» se apoya en dos webs de terceros; su FAQ lo dice
    (20:36:55 UTC: «en ningún caso ofrece instrumentos financieros sujetos a
    supervisión por parte de la CNMV ni opera a través de una entidad de
    servicios de inversión (ESI)»): añadir `https://domoblock.io/faq`.

## Lo que se sostiene hoy

ADDX (MAS: «Capital Markets Services Licensee… Recognised Market Operator»;
«open to all non-U.S. accredited and institutional investors»; accionistas SGX,
Heliconia, UOB y otros), Archax (CNMV 289 del 08/08/2019; web europea «pre-launch»
y «does not provide services to retail clients»), Blocksquare (acuerdo societario
en IPFS; plantilla «CP_COMPANY»; «Regulation · Available soon»), Figure (FINRA CRD
307093, ATS), Fireblocks (NYDFS «Limited Purpose Trust Charter»), Franklin
(folleto del 01/08/2026, «9001 P 08/26», mínimo de 20 USD, sin registro en la
UE/EEE, en marcha desde el 06/04/2021), INX (OpenDeal desde 11/2025, «public
reporting company? No»), Lofty («Buy $50», renta diaria, voto, Algorand), Maple
(«Accredited allocators who complete onboarding»; «The Company is not registered
in any capacity with any regulatory body»), Midas (folleto aprobado el
17/07/2026, válido hasta el 17/07/2027, emisor no regulado por la FMA, sede en
Berlín), OpenEden (BVI, S&P y Moody's, BNY; solo profesionales BVI y acreditados
de EE. UU.), Pax Gold (OCC, Ethereum, Solana y Base, «not available to residents
of the European Union»), Republic (FINRA CRD 291387; portal SEC 7-167), Securitize
(FINRA CRD 283256, ATS), Spiko (AMF: «Vivant», «Tous souscripteurs», agrément
05/04/2024, Twenty First Capital, CACEIS; REGAFI CIB 19183 desde el 15/12/2025;
CNMV 2380 y 5325), Superstate (fondo privado, Invesco, PwC, BNY; «registered
transfer agent with the SEC»), Swarm (Swarm Capital GmbH, Vaduz; BaFin sin
resultados), Taurus (FINMA, CySEC 465/26, TDX como OTF), Tokeny (ERC-3643;
«solely to professional clients»), tZERO (FINRA CRD 123421, ATS), xStocks
(emisor de Jersey, folleto de la FMA). Descartadas: RealT (demanda del
02/07/2025 contra 165 sociedades por más de 400 inmuebles; orden judicial de
julio de 2025; liquidación anunciada en julio de 2026, unos 700 inmuebles),
ARTEX («nor does it rely on blockchain technology in any way for the time
being»), Domoblock y Toucan (los hechos de 2022).

## Sin poder comprobar

- Centrifuge: `centrifuge.io`, `/terms` y `docs.centrifuge.io/` dan 403
  (20:15:16 y 20:29:40 UTC). La licencia y el acceso (que se apoyan en sus
  términos) quedan sin comprobar hoy; el aval sí lo respalda su `llms.txt`.
- Courtyard: `courtyard.io` da 403 (20:15:17 UTC): la actividad («La web
  muestra packs…»).
- Midas: `midas.app`, `midas.app/llms.txt` y `docs.midas.app/llms.txt` dan 403
  (20:15:24, 20:15:51 y 20:32:17 UTC): la lista de productos de la actividad.
- Republic: `republic.com` da 403 (20:15:54 UTC): lo de los Mirror Tokens de la
  entradilla. «Desde 2016» y «SIPC» del aval no salen en las fuentes FINRA
  enlazadas.
- Pax Gold: el PDF de la OCC contestó «302 Security Redirect» a la portada de la
  OCC (20:15:27 UTC); «31/10/2026 (charter 25379)» no lo he podido releer (el
  contraste de las 17:42 UTC sí lo leyó).
- RealT: `detroitmi.gov` 403 (20:16:00 UTC); las otras tres fuentes sí lo
  respaldan. Toucan: S&P Global 403 (20:16:01 UTC). Goldfinch: The Block y The
  Defiant 403 (20:16:07 UTC): el motivo queda sin comprobar.
- Spiko: la comercializadora «Aldana Capital» está en una pestaña de la CNMV que
  se carga aparte; no la he abierto.
- Backed: los bTokens (`defi.backed.fi`) dan «Access Restricted» desde aquí
  (20:32:48 UTC).
- Las clasificaciones de «Importe de entrada» (Bajo, Medio, Alto) de Figure,
  Securitize y tZERO no las he contrastado a fondo.
