# Barrido de novedades · ampliación · 10/11/2026

Encargo: buscar ofertas **nuevas** de activos reales tokenizados (últimas seis
semanas, desde finales de septiembre de 2026) que un particular en España pueda
comprar hoy con KYC normal en una entidad supervisada en la UE. Solo pistas, no
expedientes. Consultas entre las 09:05 y las 09:31 UTC. Sin sesión, KYC,
wallets, formularios ni Supabase.

## Resultado en una línea

**Una sola pista que merece seguimiento, y no es comprable hoy por la vía que
pide RWAdar:** los «Stock Tokens» de Robinhood Assets (Jersey) Limited (RHJ),
deuda tokenizada respaldada 1:1 por acciones de EE. UU., con folleto aprobado
por la FMA de Liechtenstein y pasaporte a España, y un suplemento del
**09/11/2026** que prepara la entrada de Robinhood Europe, UAB como
distribuidor. Es un producto distinto de los Classic Stock Tokens que ya
publicamos. Todo lo demás que salió en prensa estas semanas es institucional,
de un solo país, no tokenizado o ya lo estudia otro grupo.

## Cómo busqué

1. **Registro de folletos de ESMA** (API Solr pública de
   `registers.esma.europa.eu`, sin WebFetch). Saqué todos los folletos,
   suplementos y condiciones finales aprobados desde el 15/07/2026 y
   notificados a España, y los de emisores no bancarios con pasaporte a
   España en 2026. Es la prueba más dura de «oferta pública con pasaporte a
   España». Crudo en `fuentes/crudo/novedades/` (ver inventario abajo).
2. **Prensa y sector** con WebSearch (solo para descubrir): Ledger Insights
   (también su mapa del sitio hasta el 23/10), The Block, CoinDesk, Finextra,
   Funds Society, Expansión, prensa alemana, francesa e italiana.
3. **Fuente primaria de cada pista** abierta hoy con curl y copiada en
   `fuentes/novedades/`.

Nota para el coordinador: el grupo `candidatas-mercados` revisó en ESMA los
folletos pasaportados a España **desde el 01/09/2026**. El folleto base de RHJ
es del 25/06/2026, así que se le escapó; su suplemento sí es de hoy menos uno.

## Pista 1 · Robinhood «Stock Tokens» (RHJ) · prioridad 2 (en camino)

- **Qué es:** «Stock Tokens are tokenised debt securities issued by Robinhood
  Assets (Jersey) Limited» (docs.robinhood.com/rhj/product, 09:19 UTC). Más de
  200 tokens ligados a acciones y ETF de EE. UU., en Robinhood Chain,
  «backed 1:1 by the corresponding underlying equity» (FAQ). Dividendos por
  multiplicador, sin derechos sobre la acción subyacente.
- **Folleto:** folleto base de 25/06/2026 aprobado por la FMA de
  Liechtenstein; ESMA lo registra como BPWO-83 con España entre los Estados
  notificados (consulta 09:19 UTC). Suplemento aprobado por la FMA el
  **09/11/2026** (PDF, SHA-256 `978eea67…29b9`). Condiciones finales hasta el
  21/10/2026; las de American Airlines (serie 206, ISIN JE00BVPWVQ09) incluyen
  España como «Non-Exempt Offer Jurisdiction», dicen «There is no Minimum
  Investment Amount» y traen **resumen en español**.
- **Por qué interesa:** el suplemento del 09/11 añade las reglas de KYC
  lituanas «Where Robinhood Europe, UAB is specified … as an Authorised
  Participant» y repite «The Issuer anticipates appointing Robinhood Europe,
  UAB as an Authorised Participant in the near future». Robinhood Europe, UAB
  ya está en la CNMV (n.º 5299, expediente publicado). Si la nombran, sería un
  producto con folleto UE, respaldo 1:1, sin mínimo y vendido por una
  entidad supervisada en la UE con pasaporte a España.
- **Por qué no hoy:**
  - El único oferente autorizado es **Bitstamp Global Ltd (Islas Vírgenes
    Británicas)** (condiciones finales y docs.robinhood.com/rhj/service-providers).
  - La app de Robinhood Europe en España solo ofrece Classic Stock Tokens
    (robinhood.com/eu/es/invest, 09:26 UTC). Los Stock Tokens se compran
    «through Robinhood Wallet, decentralized exchanges (DEXs), or centralized
    exchanges (CEXs)». Robinhood Wallet la presta Robinhood Non-Custodial
    Wallet Limited (Islas Caimán), sin regulación UE.
  - El emisor «is not regulated» (solo consentimientos en Jersey).
  - No encontré un KID propio de RHJ: el KID de la web legal UE es el de los
    Classic (fabricante Robinhood Europe, derivado OTC).
  - Comisión de reembolso: 0 % los primeros 90 días y 0,05 % después.
- **Advertencias CNMV:** «Robinhood», sin datos (consulta de
  `acciones-oro-tesoro` a las 09:02 UTC).
- **Qué vigilar:** que el sitio del emisor (Service Provider Details) o unas
  condiciones finales nombren a Robinhood Europe, UAB como Participante
  autorizado, y que la app española muestre los Stock Tokens no «Classic».

## Descartadas (una línea cada una)

- **ST0x (S01 Issuer GmbH, Berlín; antes ST0x Technology UG).** Folleto base
  aprobado por la FMA el 30/03/2026 y notificado a España (ESMA BPWO-77). Pero
  son deuda no garantizada del emisor, se compran por wallets y DEX, la
  acuñación exige una «Eligible Broker account» y no nombra ningún
  distribuidor supervisado en la UE. ESMA no tiene condiciones finales. CNMV:
  sin advertencias por «S01 Issuer» ni «ST0x» (09:29 UTC). https://st0x.io/legal
- **Amundi Core STOXX Europe 600, clase tokenizada (05/11).** «institutional
  clients and digital platforms». Sin ISIN, KID ni distribuidor para
  particulares. `candidatas-mercados` ya tiene expediente.
  https://about.amundi.com/article/amundi-extends-tokenisation-index-investing
- **Generali, clase tokenizada de su fondo monetario (21/10).** Según la
  prensa, solo para empresas del grupo. No encontré la nota oficial.
  https://www.ledgerinsights.com/generali-launches-tokenized-share-class-of-its-money-market-fund/
- **Schroders EM Bond en Solana vía Centrifuge (04/11).** Fondo subordinado
  (feeder); la prensa cita un mínimo de 100.000 USD y no hay términos para
  particulares.
  https://theblock.co/news/business/2026-11-04-schroders-centrifuge-tokenized-emerging-markets-debt-fund-solana-432878
- **Securitize (SNL autorizado por la CNMV).** No encontré oferta para
  particulares en la UE. Sus acciones tokenizadas del 08/10 son de EE. UU. y
  exigen lista blanca.
  https://www.ledgerinsights.com/securitize-launches-tokenized-stocks-but-not-the-issuer-sponsored-kind/
- **LISE / Kriptown (París).** Su salida a bolsa tokenizada era solo para
  residentes en Francia. Hoy lise.fr da error de certificado caducado.
  https://www.ledgerinsights.com/lise-stock-exchange-preps-first-tokenized-ipo-under-dlt-pilot-regime/
- **Seturion (Börse Stuttgart) + flatexDEGIRO.** Licencia DLT del 20/10; el
  producto para particulares sigue «planned».
  https://www.ledgerinsights.com/boerse-stuttgarts-seturion-gets-dlt-trading-and-settlement-license-as-eu-cap-debate-heats-up/
- **MetaWealth.** Bonos compartimentados en un SMN de la UE: «For
  professional investors only». https://metawealth.co/
- **eToro, acciones tokenizadas.** Solo el anuncio del 29/07/2025, en futuro.
  `candidatas-mercados` ya tiene expediente.
  https://www.etoro.com/news-and-analysis/press-releases/etoro-continues-journey-towards-a-tokenized-future-with-launch-of-24-5-trading-futures-and-tokenized-stocks
- **Folletos bálticos con pasaporte a España en octubre** (Indemo SPV Issuer
  No1, Fundaro, Nectaro, Mintos, TWINO). Son notas de préstamos o de impagos,
  no tokens. Registro ESMA, 09:17 UTC.
- **Altarius ETI** (condiciones finales del 01/10, 06/10 y 27/10 con pasaporte
  a España). Son ETI en Euroclear, no tokens: el mismo motivo que Hausera ETI.
- **Finexity (bono 2026/2030) y VolksInvest.** Oferta limitada a residentes en
  Alemania.
  https://www.webdisclosure.com/press-release/eqs-adhoc-finexity-ag-finexity-issues-20262030-bond-d8gUBhY56jY
- **Azvalor Blockchain FI.** Está en el sandbox de la CNMV y «will not be open
  to distribution in this initial phase» (nota de octubre de 2025, leída con
  WebFetch).
  https://mondovisione.com/news/azvalor-launches-the-first-tokenised-fund-with-real-time-settlement-in-collabor-2025106
- **Fondo monetario de Robinhood EU** (JPM EUR Liquidity LVNAV,
  LU2599140782). No está tokenizado.
- **TSV/Canton y OKX-ICE.** Acciones tokenizadas en EE. UU., fuera de alcance.

## Inventario (fuentes propias, consultadas hoy)

Las copias están en `fuentes/novedades/`, los PDF en `fuentes/novedades/pdf/`
y el crudo de ESMA en `fuentes/crudo/novedades/`, que queda fuera de Git.

| Fuente | Archivo | Hora UTC | SHA-256 |
|---|---|---|---|
| https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf | pdf/rhj_base_prospectus_supplement_09_november_2026.pdf | 09:20:57 | 978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9 |
| https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus.pdf | pdf/rhj_base_prospectus.pdf | 09:20:58 | e3b4697a4831723867f71caaf567af7cdd882bafcd1e1b39d7d5fd338916db46 |
| https://cdn.robinhood.com/assets/robinhood/legal/rhj_final_terms_for_tokenised_debt_securities_linked_to_american_airlines_group_inc.pdf | pdf/rhj_final_terms_…american_airlines_group_inc.pdf | 09:29:26 | 8cead187df76aa2c589baf8af6adba201e78db25d13c12e1c0179aa72aadde02 |
| https://cdn.robinhood.com/assets/robinhood/legal/rhj_notice_of_proposed_amendments_oct_2026.pdf | pdf/rhj_notice_oct_2026.pdf | 09:29:19 | cd830aecbd252bb087941d4f9546d0ec32c33d9262cd4241720a7f3c0fda4ff8 |
| https://cdn.robinhood.com/assets/robinhood/legal/stock_tokens_kid_eu.pdf (KID Classic) | pdf/rh_stock_tokens_kid_eu.pdf | 09:21:33 | d744e3ac63962771cb3ea745e2b8e72b3ccf9d0cd0fc3972b6e59733eecaee96 |
| https://docs.robinhood.com/rhj/product | rhj-product.html | 09:19:56 | 0853042281055cd1b4ae9f4ecfdcfdb33c41d409371b8fa54f36a9e6bc8f4433 |
| https://docs.robinhood.com/rhj/faq | rhj-faq.html | 09:20:10 | 3d616fe7eeea15324d8948d98742fc9a20ad378a4241c53fe89005aacaf788d8 |
| https://docs.robinhood.com/rhj/service-providers | rhj-service-providers.html | 09:20:51 | b418ffc475a213b2b4e2110ece60864633779dc076d1672e405a1df9ed69ab14 |
| https://docs.robinhood.com/rhj/restricted-jurisdictions | rhj-restricted.html | 09:19:55 | 3b7b3bad707c51cf03f2bafd38cf2c5164c9e5d176b6085e5d9acccd48524bde |
| https://robinhood.com/eu/en/legal/rhj/ | rh-eu-legal-rhj.html | 09:20:52 | 2371a23c9b56d6955c2d66213f67bdaeb0fe81cba105adb2f076b6917d2bb6c6 |
| https://robinhood.com/eu/es/invest/ | rh-eu-es-invest.html | 09:26:39 | 6e5f22f1504117417c97323fc9df81d4c055c40d414675fcb201feb650c01691 |
| https://robinhood.com/eu/es/crypto/wallet/ | rh-eu-es-wallet.html | 09:26:40 | e2ed356f9445827c877c1999b166e5a8a8d35ec3731f08992f5e60c8e4debfd8 |
| https://st0x.io/legal | st0x-legal.html | 09:28:39 | 4c1f4995cd2539c7e6366d2bf10e0c2a22341ef10fa4cc7642e466135bd8d5bf |
| https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=S01%20Issuer | cnmv-adv-s01.html | 09:29:10 | 8876eec6768a095460cf8b2a694ceba9ef2789f6fda6c4f25e720601dafe5198 |
| https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=ST0x | cnmv-adv-st0x.html | 09:29:12 | 7029d0d99295b76270c77bed9c31097619cae6d76f9a42a720887e258a5ba411 |
| https://about.amundi.com/article/amundi-extends-tokenisation-index-investing | amundi-tokenisation-index.html | 09:18:49 | 08675d359f8b4bfa15e4a190014294a4b82afbda7424ddd1911a792681062e2c |
| https://metawealth.co/ | metawealth-home.html | 09:24:12 | e60d298ad72feedfebce6ca332c1154583ac145099c9819098ce768ce19b52c6 |
| ESMA, folletos notificados a España desde el 25/09 (Solr) | crudo/novedades/es_recent.json | 09:17:10 | e240f96488dd421ad2ab5eae286d42079a3047a48d23dba2a7d9bee5d052ef71 |
| ESMA, documentos de Robinhood (Solr) | crudo/novedades/robinhood.json | 09:19:13 | e443f3b3f84df5f9771f1df84b68c54b0ba3c377866ea8e21ea838bec6ea7a00 |
| ESMA, folletos notificados a España desde el 15/07 (Solr) | crudo/novedades/es_since_jul.json | 09:23:11 | ba89052b38493e708c0ded856eb8ac3a2ace93ae46a5a552912b23676c8c0d3c |
| ESMA, emisores no bancarios con pasaporte a España en 2026 (Solr) | crudo/novedades/es_2026.json | 09:27:30 | 1a8e502584841941acb077713c682a66b35ae9d6fdfaf1181aa8ad13eab03a4e |

Fallos registrados: lise.fr (certificado TLS caducado), openbrick.es (502 del
proxy), securitize.io/eu (404) y las páginas «disclosures» de docs.robinhood.com
(solo devuelven el esqueleto JS). La lista de documentos se leyó en
robinhood.com/eu/en/legal/rhj/.
