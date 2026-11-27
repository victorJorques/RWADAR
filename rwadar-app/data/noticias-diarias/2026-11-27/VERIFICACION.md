# Verificación de las noticias del 27/11/2026 · pase 1

**Veredicto: con cambios.** Cinco noticias están bien tal cual; tres necesitan un cambio pequeño (un verbo, un titular y una foto). Ninguna fuente está caída. Sin personas en ningún texto.

Edición verificada: `noticias-2026-11-27.json`, SHA-256 `aa95ac87e6b6d6b595264c078bd5472c119815eb93eb3feb5dd6061a395b57ec`.

| Noticia | Veredicto | Titular | Foto | Fecha |
| --- | --- | --- | --- | --- |
| poloniex-abre-16-acciones-etf-tokenizados | corregir | bien | bien | bien |
| banco-japon-cinco-retos-tokenizacion | confirmada | bien | bien | bien |
| canada-csa-proyecto-tokenizacion-fase-2 | corregir | cambiar | bien | bien |
| 21x-coinix-monetario-tokenizado | confirmada | bien | bien | bien |
| hong-kong-hkma-plataforma-bonos-tokenizados | confirmada | bien | bien | bien |
| cnmv-avisa-entidades-belgica-25-noviembre | confirmada | bien | bien | bien |
| suiza-snb-registro-financiero-comun | confirmada | bien | bien | bien |
| bce-valores-tokenizados-garantia-2027 | corregir | bien | cambiar | bien |

## Fuentes abiertas

### poloniex-abre-16-acciones-etf-tokenizados

- URL: https://www.poloniex.com/announcement/45050069368899
- Hora (UTC): 2026-11-27T11:35:50Z · HTTP 200
- SHA-256: `d87c763ff9c35006bbfd11455e03efd94802a649b63b86d382ae33e8c89c63ec`
- Cita: «Poloniex to Open Trading for 16 Tokenized Stocks and ETFs, Including MRVL, DRAM, SPY, LITE and BABA, from 05:00:00 (UTC) on November 27, 2026»

### banco-japon-cinco-retos-tokenizacion

- URL: https://www.boj.or.jp/en/about/press/koen_2026/data/ko261127a.pdf
- Hora (UTC): 2026-11-27T11:35:51Z · HTTP 200
- SHA-256: `1bf3874fd7011af35a271774fcb6f2630bcdfb893519273dea965dcacfb727e8`
- Cita: «While these opportunities are significant, tokenization also raises five important challenges.»

### canada-csa-proyecto-tokenizacion-fase-2

- URL: https://www.asc.ca/en/news-and-publications/news-releases/2026/11/26-csa-launches-phase-2-of-project-tokenization-invites-proposals-from-market-participants
- Hora (UTC): 2026-11-27T11:35:51Z · HTTP 200
- SHA-256: `f01e3fa7049a82e0c75313bcf7939a82b6cd19ca72499293028eba6e5d936a90`
- Cita: «The Canadian Securities Administrators (CSA) today launched Phase 2 of Project Tokenization, inviting firms to submit proposals for tokenized products, services, infrastructure and business models relevant to Canadian capital markets.»

### 21x-coinix-monetario-tokenizado

- URL: https://21x.eu/21x-enables-coinix-to-end-idle-stablecoin-balances-using-franklin-templetons-grbenji/
- Hora (UTC): 2026-11-27T11:35:52Z · HTTP 200
- SHA-256: `6669de4548f4ad7b64874381645b737bd6e133898013d22cd2e22f228a9a0dc3`
- Cita: «coinIX GmbH & Co. KGaA, a leading German investment company specialized in cryptocurrencies and blockchain-based business models, has joined 21X as a trading participant. coinIX’s first trades were in grBenji, Franklin Templeton’s tokenized money market fund share class»

### hong-kong-hkma-plataforma-bonos-tokenizados

- URL: https://www.hkma.gov.hk/eng/news-and-media/press-releases/2026/11/20261125-3/
- Hora (UTC): 2026-11-27T11:35:53Z · HTTP 200
- SHA-256: `4dde4eb55267c8373bf471ae4377b23715a5000ace040f38d4aeaa7273693001`
- Cita: «The Hong Kong Monetary Authority (HKMA) announced today (25 November) the official launch of CMU Digital Asset Platform (CMU DAP).»

### cnmv-avisa-entidades-belgica-25-noviembre

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7b4a2ff209-394f-4d63-8170-a9ed63e761b3%7d
- Hora (UTC): 2026-11-27T11:36:37Z · HTTP 200
- SHA-256: `e5bad44ac1cb9c884fff3b0c91715ef1d98b20f9ecf097a046ad860a00e9d80a`
- Cita: «La Comisión Nacional del Mercado de Valores (CNMV) hace públicas las advertencias recibidas a través de los supervisores internacionales sobre las entidades no registradas que se adjuntan en el siguiente listado»

### suiza-snb-registro-financiero-comun

- URL: https://www.snb.ch/en/publications/communication/press-releases/2026/pre_20261124_2
- Hora (UTC): 2026-11-27T11:36:07Z · HTTP 200
- SHA-256: `8137e8842147eab40e2f97779f60c0a2f325f48135b2a67843a01fcf68537742`
- Cita: «The exploratory project investigates whether a Swiss Financial Ledger can serve both cross-border transactions, as envisaged in Project Agorá, and as a platform for domestic transactions. It will explore the benefits and feasibility of a distributed ledger technology (DLT) platform on which central bank money, commercial bank money and securities can interact seamlessly.»

### bce-valores-tokenizados-garantia-2027

- URL: https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr261123~76b6f57b74.en.html
- Hora (UTC): 2026-11-27T11:36:08Z · HTTP 200
- SHA-256: `d48871fd7e726256fd3ef13852b06ce874318a0d687f35e63009ecadd3fcca2b`
- Cita: «The Governing Council of the European Central Bank (ECB) has approved the acceptance of marketable assets issued on DLT platforms licensed under the EU DLT Pilot Regime Regulation as eligible collateral for Eurosystem credit operations, subject to specific Eurosystem requirements.»

Notas de método: la página de Poloniex solo trae el armazón con una descarga simple; se leyó con un navegador sin cuenta (Chromium), y el anuncio del lote de 21 (25/11) se abrió también para comprobar esa fecha. El PDF de la CNMV cortó la conexión en algunos intentos; respondió 200 con el mismo SHA-256 que el barrido.

## Cambios que hay que aplicar

- **poloniex-abre-16-acciones-etf-tokenizados**, campo `resumen`: «El mercado de criptoactivos Poloniex abrió el 27/11 a las 05:00 (UTC) la compraventa en USDT de 16 acciones y ETF de EE. UU. tokenizados de la serie bStocks, entre ellos Apple, Microsoft, Amazon y un ETF del S&P 500. Forman parte de un lote de 21 que anunció el 25/11.» → «El mercado de criptoactivos Poloniex abre el 27/11 a las 05:00 (UTC) la compraventa en USDT de 16 acciones y ETF de EE. UU. tokenizados de la serie bStocks, entre ellos Apple, Microsoft, Amazon y un ETF del S&P 500. Forman parte de un lote de 21 que anunció el 25/11.». El anuncio dice que Poloniex «will open» la negociación a las 05:00 (UTC) del 27/11; no confirma que ya se abriera. Presente, como el titular.
- **poloniex-abre-16-acciones-etf-tokenizados**, campo `en.resumen`: «Crypto exchange Poloniex opened USDT trading in 16 tokenised US stocks and ETFs from the bStocks series at 05:00 (UTC) on 27/11, including Apple, Microsoft, Amazon and an S&P 500 ETF. They are part of a batch of 21 announced on 25/11.» → «Crypto exchange Poloniex opens USDT trading in 16 tokenised US stocks and ETFs from the bStocks series at 05:00 (UTC) on 27/11, including Apple, Microsoft, Amazon and an S&P 500 ETF. They are part of a batch of 21 announced on 25/11.». Igual que en castellano: la fuente anuncia la apertura («will open»), no la confirma.
- **canada-csa-proyecto-tokenizacion-fase-2**, campo `titulo`: «Canadá abre la puerta a probar productos tokenizados» → «Los supervisores de Canadá buscan proyectos tokenizados». La fase 2 invita a presentar propuestas para ver cómo se aplican las normas; la fuente solo cita pruebas («testing») como posible acción futura, así que «probar productos» exagera. Sujeto exacto: los supervisores (CSA), no «Canadá». Es una de las propuestas del propio editor (55 caracteres).
- **canada-csa-proyecto-tokenizacion-fase-2**, campo `en.titulo`: «Canada invites firms to test tokenised products» → «Canadian regulators seek tokenised projects». Mismo motivo: la fuente invita a presentar propuestas, no a probar productos. Es una de las propuestas del propio editor (43 caracteres).
- **bce-valores-tokenizados-garantia-2027**, campo `imagen`: «real-monedas-euro-bandera» → «real-bce-francfort». La guía (§ 4, regla 1) pide la sede del supervisor si está en la biblioteca. La torre del BCE ya no la usa ninguna otra noticia (la otra del BCE salió de la edición), así que el motivo del editor ya no vale. Crédito comprobado: fotos-noticias.json y fotos.json coinciden (autor, CC BY-SA 4.0, misma página de Commons).

## Lo demás

- Sección «Hoy»: Poloniex y el Banco de Japón son de hoy; Canadá, de ayer. Correcto.
- Ninguna foto se repite. Los créditos de las fotos reales (Bolsa de Nueva York, Tesoro de EE. UU., sala de servidores, sede de la CNMV, monedas de euro y, tras el cambio, torre del BCE) coinciden entre la biblioteca y los datos de la web.
- suiza-snb-registro-financiero-comun lleva la escena de IA «red-europea» habiendo una foto real libre del tema «Emisiones e infraestructura» (real-servidores-cables, que no usa ninguna otra noticia). No se corrige: la escena no engaña; queda a juicio de la sesión.
- En barrido.json no hay nada de hoy o de ayer más importante que lo elegido (CNMV, ESMA, BCE, Consejo, Comisión y EBA sin novedades del sector de hoy o de ayer; el BOE de hoy no trae nada del sector).
