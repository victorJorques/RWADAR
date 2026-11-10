# Barrido del radar sin oferta publicada · ampliación · 10/11/2026

Encargo: revisar en su web oficial de hoy las 23 plataformas del radar que no
tienen ninguna oferta publicada en RWAdar (addx, archax, backed-finance,
blocksquare, centrifuge, courtyard, figure, fireblocks, franklin-templeton,
inx, lofty, maple-finance, ondo-finance, openeden, pax-gold, reental,
republic, securitize, superstate, swarm, taurus, tokeny, tzero). Pregunta:
¿hay hoy una oferta concreta que un particular residente en España pueda
comprar, directamente o a través de un socio europeo con licencia? Solo
pistas, no expedientes.

Consultas entre las 09:33 y las 09:45 UTC, con curl y Playwright (texto
visible de la página renderizada). Sin sesión, KYC, wallets, formularios ni
Supabase. WebSearch y WebFetch solo sirvieron para descubrir (ver el
inventario). Copias en `fuentes/radar-sin-oferta/`, PDF en
`fuentes/radar-sin-oferta/pdf/` e inventario con SHA-256 en
`fuentes/radar-sin-oferta/inventario-consultas.json`.

## Resultado en una línea

**Una sola pista: Securitize Stocks a través de Securitize Europe (CNMV,
n.º 327).** Prioridad 3. Las otras 22 plataformas no tienen hoy nada
comprable por un particular en España por una vía supervisada en la UE, o lo
que tienen ya lo estudia otro grupo.

## Pista 1 · Securitize Stocks vía Securitize Europe · prioridad 3

**Qué es.** Acciones de EE. UU. tokenizadas en Solana (AAPL, MSFT, NVDA,
TSLA, SPCX y unas 25 más; la portada de hoy muestra precios en vivo). Cada
token es un «security entitlement» (art. 8 del UCC) sobre una acción que
custodia Securitize Markets, LLC (bróker de EE. UU., SEC/FINRA), respaldado
1:1 y sin préstamo de las acciones. Se lanzó el 08/10/2026.

**Por qué puede valer hoy.**

- La página del producto dice «Available in the U.S., EU and other eligible
  markets» (securitize.io/investments/stocks, 09:34 UTC). La nota de prensa
  del 08/10/2026 habla de «eligible investors in the United States, European
  Union (EU) and other permitted jurisdictions».
- El pie de stocks.securitize.io dice: «For any EU-based investors,
  investment and ancillary services are offered by Securitize Europe
  Brokerage and Markets, S.V., S.A.» (CNMV n.º 327).
- **CNMV, programa de actividades (hoy, 09:38 UTC):** la recepción y
  transmisión de órdenes y la ejecución de órdenes tienen marcadas las
  columnas «Retail», «Professional» y «Eligible counterparties». Registro
  oficial del 25/04/2025. La limitación es que «Los servicios se prestarán
  exclusivamente respecto de instrumentos financieros digitales». Esto
  **corrige lo que se anotó el 03/11** («Según la prensa, solo atiende a
  clientes profesionales»; aquel día no cargó la pestaña de la CNMV).
- **Documentos de la UE, versión de abril de 2026** (biblioteca de
  divulgación de securitize.io):
  - el documento precontractual MiFID II dice «Currently, Securitize Europe
    only offers American Tokenized Shares» y clasifica a los clientes como
    «retail clients, professional clients, or eligible counterparties»;
  - pertenece a FOGAIN, que «guarantees Retail Clients» hasta 100.000 €;
  - hace test de conveniencia, y si el producto no es conveniente, no deja
    operar.
- Advertencias de la CNMV por «Securitize»: «No data available» (09:39 UTC).
- Comisiones publicadas (securitize.io/fee-schedule-table): «CET & ET
  Commission 0.1%» por operación y «USDC/USD 0.1%» de Zero Hash. Las
  preguntas frecuentes no fijan ningún mínimo: «Tell us how much USDC you are
  willing to spend».

**Dudas que el expediente tendría que resolver.**

1. **No hay una fuente que diga en claro que un minorista español puede
   comprar *Securitize Stocks* hoy.** El texto legal del producto dice «to
   eligible investors in permitted jurisdictions, subject to onboarding», y
   la misma página abre con «tokenized stocks are here for U.S. investors».
   Sin darse de alta no se puede comprobar.
2. **Barrera práctica.** «Trading is supported using third party
   self-custody wallets only». Hay que tener una wallet de Solana propia,
   aprobada en una lista blanca, y USDC. Eso es más que un «KYC normal».
   Securitize Europe «does not currently offer custody services» (Términos
   UE, cláusula 11.1).
3. **Qué se compra.** No es la acción, sino un derecho sobre ella a través de
   un bróker de EE. UU. Los CET no se pueden reembolsar en dinero («A CET is
   not redeemable for cash»): se sale vendiendo en la plataforma de
   Securitize (PropAMM con creador de mercado) o convirtiéndolo en acción
   anotada (30 USD). El único mercado secundario es el de Securitize. Precio
   en USD/USDC, de 4:00 a 17:30 (hora del Este de EE. UU.).
4. No hay KID ni folleto en la UE. Probablemente no hacen falta para un
   derecho sobre acciones cotizadas, pero el coordinador debe confirmarlo
   (PRIIPs).
5. Hay un conflicto interno en el grupo: `barrido-novedades.md` la descartó
   hoy («exigen lista blanca»). La lista blanca es el paso de alta de la
   wallet, no una exclusión.

Fuentes: securitize.io/investments/stocks, stocks.securitize.io (y /faq,
/trading), securitize.io/learn/press/securitize-launches-tokenized-us-stocks,
securitize.io/disclosure-library (PDF precontractual UE, Términos UE y
Entitlement Token Disclosure del 15/09/2026), securitize.io/fee-schedule-table,
CNMV ESI n.º 327 (vista 12 y vista 17) y buscador de advertencias.

## Descartadas (una línea cada una, consulta de hoy)

- **ADDX.** «ADDX is open to all non-U.S. accredited and institutional
  investors» (MAS, Singapur). https://www.addx.co/en/inside-addx/
- **Archax.** «Archax Markets Europe does not provide services to retail
  clients», y «All services are currently in pre-launch preparation».
  https://eu.archax.com/
- **Backed Finance.** Remite a xStocks («xStocks are now live on multiple
  venues»). La venta a particulares va por distribuidores (Kraken y otros) que
  ya cubren otros grupos. https://backed.fi/
- **Blocksquare.** «Tokenization infrastructure for real estate»: es
  infraestructura. Las ofertas de portales las cubre otro grupo (expediente
  `blocksquare-oceanpoint-marketplace` de hoy). https://blocksquare.io/
- **Centrifuge.** «Centrifuge does not originate assets, manage money or
  issue financial products». Sus fondos (Anemoy JTRSY, JAAA, SPXA) y las
  envolturas deJAAA son institucionales o DeFi. La portada da 403 de
  Cloudflare; leído en docs.centrifuge.io/llms.txt.
  https://docs.centrifuge.io/llms.txt
- **Courtyard.** «Digital Packs, Physical Cards. Vaulted and insured.» Son
  coleccionables, fuera de alcance. https://courtyard.io/
- **Figure.** Crédito y Figure Markets en EE. UU. (Figure Securities,
  FINRA). En la UE solo aparece Figure Markets Ireland Limited, sin una oferta
  a particulares ni registro MiCA en ESMA. https://www.figuremarkets.com/disclosures/
- **Fireblocks.** «Infrastructure that powers financial possibility … Talk
  to sales»: software para empresas. https://www.fireblocks.com/
- **Franklin Templeton.** Benji/FOBXX es un fondo monetario de EE. UU. El
  folleto excluye la UE. grBENJI se rechazó hace poco y otro grupo estudia sus
  fondos tokenizados. https://digitalassets.franklintempleton.com/benji/
- **INX (hoy Republic).** «Availability depends on asset type, investor
  eligibility, and jurisdiction». Es un ATS de EE. UU. sin entidad de la UE.
  https://inx.co/
- **Lofty.** «We are not registered with the U.S. Securities and Exchange
  Commission as a national securities exchange or in any other capacity».
  https://www.lofty.ai/terms
- **Maple Finance.** «open to global investors (non-US)», pero «The Company
  is not registered in any capacity with any regulatory body in any
  jurisdiction». Es crédito cripto (DeFi).
  https://docs.maple.finance/legal/interface-terms-of-use-syrupusdc-and-syrupusdt
- **Ondo Finance.**
  - Lo nuevo son los **Ondo Intelligent Portfolios** (24/09/2026): notas
    estructuradas del emisor de las BVI. Para el EEE siguen las reglas de
    Ondo Stocks: «Professional Client» o «Qualified Investor» si se compra
    directamente al emisor.
  - El folleto de la FMA cubre «Ondo Stocks» y USDY, no los portfolios.
  - Ondo Stocks a través de socios lo estudia otro grupo.
  - https://docs.ondo.finance/intelligent-portfolios/eligibility.md
- **OpenEden.** TBILL: «only accessible to professional investors» (BVI) o
  acreditados de EE. UU. Sus otras entidades están en las BVI y Bermudas.
  https://docs.openeden.com/tbill/investor-onboarding
- **Pax Gold.** «For EU visitors: PAXG is currently not available to
  residents of the European Union». https://www.paxg.com/
- **Reental.** Lo cubre otro grupo (expediente `reental-rentas-4` de hoy).
  No encontré nada que se le escape. https://www.reental.co/es
- **Republic.**
  - La web de Republic Europe ofrece «Equity, Convertible, Cohorts, Funds,
    VCTs, Secondaries, Debt, and SPVs» (artículo del 04/02/2026). Es
    crowdfunding de Seedrs Europe Limited (ECSP, Central Bank of Ireland).
  - Su centro de ayuda no tiene ningún artículo sobre tokens: «We couldn't
    find any articles for: token».
  - republic.com da 403 de Cloudflare.
  - https://help.republic.com/en/articles/1913261-types-of-campaigns
- **Superstate.** USTB y USCC son solo para «Qualified Purchasers». Opening
  Bell tokeniza acciones con folleto de la SEC; no tiene entidad ni socio en
  la UE. https://superstate.com/investors
- **Swarm.**
  - Spain figura en su lista de países, pero la entidad es Swarm Capital GmbH
    (Vaduz), y ya el 01/11 no salía en el registro de la FMA.
  - Dice «Presently we don't have a license to transfer real underlying
    stocks directly to token holders».
  - Los reembolsos se tramitan solo cuando las solicitudes suman 100.000 USD.
  - https://docs.swarm.com/getting-started/faq.md
- **Taurus.** «Taurus is a Swiss digital asset infrastructure provider for
  banks and regulated financial institutions» (FINMA; Taurus Europe, CySEC
  465/26). https://www.taurushq.com/
- **Tokeny.** Software para emisores. Su único caso en la UE es para
  «European Professional Investors» (Kerdo.io). https://tokeny.com/
- **tZERO.** «a leader among tokenized securities ATSs in the US»: entidades
  de la SEC y la FINRA, sin entidad en la UE. https://tzero.com/

## Bloqueos

- centrifuge.io, docs.centrifuge.io y app.centrifuge.io: 403 de Cloudflare
  con curl, Playwright y WebFetch. Se leyó docs.centrifuge.io/llms.txt.
- europe.republic.com y republic.com: 403 de Cloudflare. Se leyó
  help.republic.com (centro de ayuda de Republic Europe).
- ondo.finance/intelligent-portfolios muestra «not accessible in your
  jurisdiction» (la salida del proxy). Se leyó docs.ondo.finance.
- Los PDF de la UE de Securitize se descargan desde el CDN de builder.io con
  un token en la URL. En el inventario la URL va recortada.
