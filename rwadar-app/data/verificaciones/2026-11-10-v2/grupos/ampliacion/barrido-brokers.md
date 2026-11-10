# Barrido por distribuidores · ampliación · 10/11/2026

Encargo: buscar ofertas **nuevas** de activos reales tokenizados que un
particular residente en España pueda comprar hoy **a través de un distribuidor
que ya usa**: bróker, banco, neobanco o exchange autorizado (MiFID o MiCA con
pasaporte a España) o una bolsa con segmento DLT. Solo pistas, no expedientes.
Consultas entre las 09:38 y las 09:49 UTC. Sin sesión, KYC, wallets,
formularios ni Supabase.

## Resultado en una línea

**Ninguna pista nueva que cumpla hoy.** Ningún bróker, banco o neobanco
generalista de los que usa un residente en España (XTB, Degiro, Interactive
Brokers, Scalable, Freedom24, Lightyear, Trading 212, N26, bunq, Vivid,
MyInvestor, Openbank, ING) vende hoy un producto tokenizado propio. Los
exchanges con pasaporte que sí listan activos reales tokenizados venden
xStocks, Ondo u oro, que ya están publicados o los estudia otro grupo. El único
movimiento de un distribuidor es el de Robinhood Europe con los Stock Tokens
de RHJ, que ya recoge `barrido-novedades.md` (no lo repito).

## Cómo busqué

1. **Lista de la CNMV de empresas de servicios de inversión del EEE en libre
   prestación** (copia de hoy del grupo, `fuentes/cnmv/esi-eee-libre-prestacion.txt`).
   Saqué las 88 altas de 2025 y 2026 y busqué nombres ligados a tokenización.
   Salen IZNES SAS (n.º 5334, 23/02/2026), Taurus (Europe) Ltd (n.º 5367,
   13/10/2026), UAB Axiology DLT (n.º 5350), Spiko Finance (n.º 5325), One
   Trading Exchange (n.º 5283), PM MTF Ltd (n.º 5315), Webull Securities
   (Europe) y Finary. De las altas antiguas, la única nueva para nosotros es
   Trek Labs Europe (Backpack EU, n.º 3977). Abajo, qué es cada una.
2. **Listas públicas de activos de los exchanges** (API sin sesión) para ver
   si listan algo más que cripto: Bitvavo, Bit2Me y Kraken.
3. **Prensa y buscador** (WebSearch, solo para descubrir) por cada distribuidor
   del encargo, en inglés, español, alemán y francés, y una búsqueda ampliada
   de lanzamientos de octubre y noviembre de 2026.
4. **Fuente primaria** de cada descarte abierta hoy con curl. La copia queda en
   `fuentes/crudo/brokers/`, fuera de Git porque las notas de prensa traen
   nombres y teléfonos de contacto.

## Descartadas (una línea cada una)

### Brókers, bancos y neobancos generalistas

- **Interactive Brokers (IBIE, Irlanda).** Solo cripto, a través de zerohash
  Europe (CASP neerlandés): «Trade Bitcoin, Ethereum, Bitcoin Cash, Litecoin,
  Solana…». No tiene acciones, fondos ni bonos tokenizados.
  https://www.interactivebrokers.ie/en/trading/products-crypto-assets.php
  (09:47 UTC). La nota de prensa del 31/03/2026 en Business Wire devolvió un
  403 (con curl y con WebFetch).
- **Degiro (flatexDEGIRO) con Seturion y Société Générale.** Solo anunciado:
  SG «intends to issue tokenized structured securities via Seturion… These
  instruments are planned to be listed». No hay producto, fecha ni folleto.
  Además, SG-FORGE lo estudia otro grupo. **Vigilar**, porque Degiro tiene
  muchos clientes en España.
  https://s206.q4cdn.com/770226284/files/doc_news/2026/05/260521-flatexDEGIRO_press-release_partnership-Seturion_SocGen_Forge_flatexDEGIRO.pdf
- **N26, fondo monetario flexible.** No está tokenizado: es «un placement
  réglementé dans un fonds monétaire (FMM) géré par Fidelity International».
  La página no menciona token ni blockchain.
  https://n26.com/fr-fr/presse/communique-de-presse/n26-lance-un-fonds-monetaire-flexible-pour-enrichir-son-offre-dinvestissement
- **XTB, Scalable Capital, Freedom24, Lightyear, Trading 212, bunq, Vivid,
  MyInvestor y Openbank.** El buscador no encontró ningún producto tokenizado
  en 2026. XTB lanzó opciones en España; bunq tiene cripto y cestas de
  acciones; Scalable amplía su servicio de cripto. Sin fuente primaria que
  abrir, porque no hay producto.
- **Webull Securities (Europe) B.V. y Finary SAS** (altas en la CNMV de 2026).
  No las investigué más: ninguna búsqueda las relacionó con productos
  tokenizados. Si Finary vendiera Spiko, sería un producto ya publicado.

### Exchanges con pasaporte (listas de activos)

- **Bitvavo (MiCA, AFM).** API pública: 482 activos. El único con respaldo
  real es EURCV, una stablecoin de SG-FORGE. No lista xStocks, oro ni fondos.
  https://api.bitvavo.com/v2/assets (09:40 UTC)
- **Bit2Me (CASP español).** API pública: 510 activos. Con activo real solo
  hay oro (PAXG, XAUT y TXAU, que lleva otro grupo) y EURCV. Bit2Me STX ya lo
  estudia otro grupo.
  https://gateway.bit2me.com/v2/currency/assets (09:40 UTC)
- **Kraken (ya publicado).** API pública: 860 activos. Además de los xStocks
  publicados, solo hay PAXG y XAUT (oro, otro grupo), EURCV y «JAAAC». La API
  no da su nombre; parece el JAAA de Centrifuge, rechazado el 01/11 por
  institucional. No lo comprobé más.
  https://api.kraken.com/0/public/Assets (09:48 UTC)
- **Backpack EU (Trek Labs Europe Ltd, CySEC, MiFID).** En la UE solo ofrece
  futuros perpetuos: «Backpack EU gives European users access to perpetual
  futures». Las acciones de su web global las ofrece «Backpack Securities…
  only in eligible jurisdictions», y no consta ninguna entidad de la UE.
  https://learn.backpack.exchange/blog/backpack-eu-launch y
  https://eu.backpack.exchange/ (canónica backpack.exchange, 09:42 UTC)
- **One Trading Exchange B.V. (AFM).** Solo futuros perpetuos de cripto para
  minoristas de Alemania, los Países Bajos y Austria. No encontré acciones
  tokenizadas. Solo hay prensa, no abrí fuente primaria.
- **PM MTF Ltd (CySEC, n.º 5315 en la CNMV).** Es el SMN de Perpetuals.com
  (derivados). No tiene activos reales tokenizados.
- **Ether.fi (agosto de 2026).** Es una app de autocustodia que vende
  xStocks. No es una entidad de la UE, y los xStocks los estudia otro grupo.

### Infraestructuras y bolsas DLT

- **IZNES SAS (Francia, n.º 5334 en la CNMV desde el 23/02/2026).** Registra
  en blockchain participaciones de fondos de Candriam (19/05/2026) y el
  monetario de Delubac AM (03/02/2026). Es solo para institucionales: su
  infraestructura «a été conçue pour répondre aux exigences des sociétés de
  gestion et des investisseurs institutionnels» (nota de Delubac), y en la
  portada lo describen como un canal para sus «institutional clients».
  https://iznes.io/wp-content/uploads/2026/05/20260512_Iznes_Candriam_FINAL.pdf
  y https://www.delubac.com/pdf/CP_DAM_Fonds_monetaire_tokenise.pdf (09:45 UTC)
- **Taurus (Europe) Ltd (CySEC, n.º 5367 en la CNMV desde el 13/10/2026).**
  Su licencia MiFID es para «support banks and financial institutions across
  Europe». No tiene oferta para particulares. Ya se rechazó el 01/11
  (`taurus-sin-oferta-concreta`) y hoy sigue igual.
  https://www.taurushq.com/blog/taurus-secures-mifid-investment-firm-license-to-expand-regulated-digital-asset-services-in-the-eu/
- **21X con Investre y Moniflo (Luxemburgo).** Solo hay un acuerdo (09/09/2026)
  para listar fondos tokenizados; no se ha anunciado ningún fondo. Moniflo, la
  app para particulares de Investre (desde 500 €), vende fondos UCITS normales
  de Schroders, Candriam y otros, no tokenizados.
  https://21x.eu/investre-and-21x-partner-to-bring-natively-tokenized-funds-to-a-regulated-exchange/
  y https://www.moniflo.com/ (09:43 UTC)
- **OpenBrick (BME/Iberclear).** No figura entre las 8 infraestructuras DLT
  autorizadas por ESMA (PDF del 04/11, leído por el grupo). Su web no se pudo
  leer: openbrick.es da un 502 en el proxy y WebFetch no resuelve el dominio;
  openbrick.com cortó la conexión. **Para leerla hay que permitir openbrick.es
  en la red de la sesión.**
- **BME (segmento DLT) y SIX.** No hay ningún segmento DLT para minoristas. El
  acuerdo de SIX del 15/04/2026 es solo de datos de precios (Chainlink), no de
  acciones tokenizadas.
  https://www.financemagnates.com/institutional-forex/exchanges/six-hands-the-tokenized-stocks-race-its-first-european-blue-chips/
- **Gold Grain Capital B.V. (alta en la CNMV el 20/07/2026).** No tiene nada
  que ver con la tokenización. Según webs de reseñas de brókers (no lo
  comprobé), la CONSOB tendría una advertencia sobre ella. Fuera de alcance.

## Qué vigilar

- **Seturion con flatexDEGIRO y SG:** la primera emisión tokenizada para
  minoristas y si Degiro la ofrece en España.
- **Robinhood Europe como Participante autorizado de los Stock Tokens de RHJ**
  (ver `barrido-novedades.md`).
- **21X:** el primer fondo de Investre que se liste y si algún bróker con
  pasaporte a España lo da a minoristas.

## Inventario (copias en `fuentes/crudo/brokers/`, fuera de Git)

| Fuente | Archivo | Hora UTC | SHA-256 |
|---|---|---|---|
| https://api.bitvavo.com/v2/assets | bitvavo-api-v2-assets.json | 09:40:11 | 4addcae1953458ed5d781987e66072cf4cfbc6a93032e635a0909762d246eba9 |
| https://gateway.bit2me.com/v2/currency/assets | bit2me-gateway-v2-currency-assets.json | 09:40:34 | 59a709a87a5699369c9743b95c4016277ba3fa50c6048536ca9a53830eb23341 |
| https://api.kraken.com/0/public/Assets | kraken-api-public-assets.json | 09:48:00 | 25cd653db12434910c09dc98598120d93fb20376f9fe7985b3cad8010af08eb6 |
| https://eu.backpack.exchange/ | backpack-eu-portada.html | 09:42:12 | c4110dc9b869e3567a6459de89a6798cbf7083b2cf896439ad63d0907927e36e |
| https://learn.backpack.exchange/blog/backpack-eu-launch | backpack-eu-launch-blog.html | 09:42:12 | f319b71028a2f6d29513a13e7c36ec895f25f157cede719d0891baedf7830691 |
| https://21x.eu/investre-and-21x-partner-to-bring-natively-tokenized-funds-to-a-regulated-exchange/ | 21x-investre-2026-09-09.html | 09:43:13 | 16b92a883c730615d33729ddde9c37df5d374d1726fb9626cf6bdb8f7b8c3bbe |
| https://www.moniflo.com/ | moniflo-portada.html | 09:43:13 | 256d09fd615ca84297843a0627d5eae12a0c50e43e538c55f20ac1aedb080e09 |
| https://iznes.io/wp-content/uploads/2026/05/20260512_Iznes_Candriam_FINAL.pdf | iznes-candriam-2026-05.pdf | 09:45:03 | 1daf64fbb08d159372c3b8725ba6d75727be32b74bd52d4c6b279507ba537472 |
| https://www.delubac.com/pdf/CP_DAM_Fonds_monetaire_tokenise.pdf | delubac-iznes-2026-02.pdf | 09:45:03 | 9b1ecc364bff2a569a57d255ea08a7362c207f98fcd2918fc26e73bf15d118cc |
| https://iznes.io/en/ | iznes-portada-en.html | 09:45:03 | 7f336d05103c65ce973d810c459cbe00c3557093f71a31d959666cb627db311c |
| https://s206.q4cdn.com/…/260521-flatexDEGIRO_press-release_partnership-Seturion_SocGen_Forge_flatexDEGIRO.pdf | flatexdegiro-seturion-2026-05-21.pdf | 09:46:11 | 5f3eadf35a133cd8147e13a0f73d97e10a8b1ebdaf85ff448821856634ae81e2 |
| https://n26.com/fr-fr/presse/communique-de-presse/n26-lance-un-fonds-monetaire-flexible-pour-enrichir-son-offre-dinvestissement | n26-fonds-monetaire-fr.html | 09:46:11 | 039c178224b4643025f117426f64519147439f343ed8c8434cf40ab52cc42c46 |
| https://www.taurushq.com/blog/taurus-secures-mifid-investment-firm-license-to-expand-regulated-digital-asset-services-in-the-eu/ | taurus-mifid-blog.html | 09:46:11 | d74786272e30797f6b9db87e1d3474e0b9ea6d4485a07bb19a7cce45c9dac429 |
| https://www.interactivebrokers.ie/en/trading/products-crypto-assets.php | ibkr-ie-crypto-assets.html | 09:47:10 | fa9e4f95db45f080e2b034995ac4dec8c417a215dd73a0d7da7e56181c2240d1 |

Fallos: openbrick.es (502 en el proxy; WebFetch no resuelve el dominio),
www.openbrick.com (conexión cortada), la nota de IBKR en businesswire.com
(curl cortado y 403 con WebFetch) y backpack.exchange/eu (404).
