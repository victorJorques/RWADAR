# Auditoría independiente · acciones-oro-tesoro · 20/11/2026

Auditor que no investigó ni montó nada de esta entrega. Fuentes abiertas hoy
entre las 17:16 y las 17:24 UTC con peticiones normales (curl con su agente por
defecto, TLS verificado; Playwright sin ocultación y con idioma es-ES solo para
las páginas de Prosegur, que se pintan con JavaScript). Ningún bloqueo se ha
intentado sortear. Copias en `/tmp/auditoria-2026-11-20/` (fuera del
repositorio).

Fichas: Robinhood Classic Stock Tokens, Kraken xStocks, Prosegur Digital Gold y
mTBILL. Lo que se va a publicar = lo publicado el 13/11 + DECISIONES §2 y §4
(mTBILL: 1,0789 USD y 3,46 %; Kraken: «más de 1.000»; Robinhood y Prosegur:
solo la fecha).

**Resultado: 2 cambios obligatorios y 6 recomendados.** Las cifras nuevas
(mTBILL) y el cambio de Kraken se sostienen; los documentos PDF son los mismos,
byte a byte.

## Cambios obligatorios

1. **Kraken xStocks · «Sobre esta oferta» (descripción) seguiría diciendo «más
   de 130».** DECISIONES §2 solo cambia el `resumen`. La `descripcion` de
   `documentacion-ofertas.json` (base del 13/11) empieza con el resumen viejo:
   «…que siguen el precio de más de 130 acciones y ETF de EE. UU. …». La web
   (`partesDocumentacionOferta`) solo recorta la descripción si empieza por el
   resumen; si el resumen pasa a «1.000» y la descripción no, la ficha enseña
   la descripción entera, con «más de 130».
   - Fuente hoy: eu.kraken.com/es/xstocks (17:17:53 UTC): «Kraken ofrece
     acceso a más de 1.000 acciones y ETF de EE. UU.»; en inglés (17:17:29
     UTC): «Kraken offers access to 1,000+ U.S. stocks and ETFs».
   - Corrección: en `documentacion-ofertas.json` → `kraken-xstocks.descripcion`,
     cambiar «más de 130 acciones y ETF de EE. UU.» por «más de 1.000 acciones
     y ETF de EE. UU.» (igual que el resumen nuevo).

2. **Robinhood Classic Stock Tokens · falta el aviso de pérdida total.** Los
   seis avisos no dicen en llano que se puede perder todo lo invertido ni que
   es un producto complejo; solo está la métrica «Riesgo KID 7 de 7». Las otras
   tres fichas del grupo sí lo dicen.
   - KID en español (17:19:28 UTC, SHA-256 `84f4f0a8…a4f501`, el mismo):
     «podría sufrir pérdidas significativas o incluso perder la totalidad de su
     inversión» y «El Producto es un instrumento financiero complejo».
   - robinhood.com/eu/es/invest (17:19:38 UTC): «Los inversores pueden llegar
     a perder el importe total del capital invertido como consecuencia de las
     condiciones del mercado o la insolvencia de Robinhood».
   - Corrección: añadir el aviso «Producto complejo (riesgo 7 de 7): puedes
     perder todo lo invertido si el precio cae o si Robinhood Europe no puede
     pagar.»

## Cambios recomendados

3. **Kraken · referencia «Dividendos».** Dice «Preguntas frecuentes de Kraken
   sobre xStocks, actualizadas el 30/10/2026» (fechaDato 2026-10-30). Hoy
   (17:17:29–17:17:41 UTC) la página dice «Last updated: November 11, 2026». La
   frase de la retención del 30 % sigue igual. Corrección: fechaDato
   2026-11-11, fechaConsulta 2026-11-20 y alcance «Preguntas frecuentes de
   Kraken sobre xStocks, actualizadas el 11/11/2026».
4. **Kraken · fuente de «Condiciones finales».** La única condición final que
   se enlaza es la de LITEx (26/03/2026, emitida con el folleto de 2025). Las
   del folleto vigente dicen lo mismo: ANTx, 19/11/2026 (17:19:14 UTC,
   SHA-256 `116a61b3…472300`): «The Products will be offered in Liechtenstein
   and Switzerland (only to Swiss Professional Investors)». Corrección:
   enlazar
   `https://sppdownloaddocumentservice.l-p-a.com/api/DownloadDocument/UPI/CH1588667217/BF%20Final%20Terms%20AND%20Summary%20(PDF)`
   en lugar de (o junto a) la de LITEx.
5. **mTBILL · las comisiones tampoco coinciden.** La métrica «Comisiones
   (KID)» es fiel al KID, pero las Condiciones Finales (17:16:35 UTC, SHA-256
   `b1e58001…3944a`, el mismo) dicen «Instant Subscription Fee up to 0.2%» y
   «Redemption Fees up to 0.05%», y el KID dice «No cobramos comisión de
   entrada» y «reembolso estándar: sin comisión». Corrección: añadir al aviso
   del conflicto «Las comisiones tampoco coinciden: las Condiciones Finales
   permiten hasta 0,2 % al suscribir de forma inmediata y hasta 0,05 % al
   reembolsar; el KID no cobra entrada ni reembolso estándar.»
6. **mTBILL · fuentes de la tarjeta.** Tres de las cuatro (midas.app/mtbill,
   docs.midas.app/resources/legal-product-documentation/mtbill y
   docs.midas.app/llms-full.txt) dan 403 a una petición normal (17:17:03 UTC),
   y ninguna es el oráculo ni los PDF que respaldan las cifras y los avisos.
   Corrección: añadir las Condiciones Finales y el KID en español del CDN de
   GitBook (responden 200, mismo SHA-256) y el oráculo
   0x056339C044055819E8Db84E71f5f2E1F536b2E5b (la lista que ya propone el
   expediente).
7. **Prosegur · métrica «Custodia».** «Oro en inventario común custodiado por
   Prosegur (sin lingote asignado)» puede leerse como oro mezclado con el de
   Prosegur. El contrato (17:20:18 UTC, «Actualizado el 08/07/2026») dice
   «Dicho oro permanecerá segregado de los activos propios de Prosegur Crypto»
   y «inventario segregado de naturaleza fungible», y admite custodios
   terceros. Corrección: «Oro separado de los bienes de Prosegur, en un
   inventario conjunto de los clientes (sin lingote asignado)».
8. **mTBILL · «Entidad que comercializa».** «oferta directa del emisor en
   midas.app» roza la «venta directa» que la guía de acceso pide no escribir.
   Las Condiciones Finales (17:16:35 UTC): «The Issuer consents to the use of
   the Base Prospectus and these Final Terms by any financial intermediary».
   Corrección: «Midas Software GmbH, en su web midas.app; las Condiciones
   Finales autorizan a cualquier intermediario a usar el folleto y no nombran
   colocadores en España».

## Lo comprobado y conforme (con hora UTC de hoy)

### mTBILL
- Oráculo por `ethereum-rpc.publicnode.com` (17:16:25 UTC): la última ronda
  sigue siendo la **498**, 1,07890125 USD, del 20/11/2026 11:41:35 UTC →
  «1,0789 USD (20/11/2026)». No hay ronda 499.
- Ronda 475: 1,07534190 USD, del viernes 16/10/2026 13:47:47 UTC (474 del
  15/10 y 476 del 19/10). 34,9124 días → (1,07890125 / 1,07534190 − 1) × 365 /
  34,9124 = **3,4605 % → 3,46 %** (compuesto 3,515 %). Correcto, también la
  etiqueta y el aviso «del 16/10 al 20/11/2026».
- Condiciones Finales (17:16:35 UTC, SHA-256 igual): «Minimum Investment
  Amount not applicable», «Redemption Gates 25% …», «Holdback Percentage up to
  5%», «Instant Redemption Fee 0.07%», España en «Offer(s) to the Public»,
  «Prohibition of Sales to EEA Retail Investors not applicable», «deficit not
  covered by equity of EUR 5’778’815.22» (2025), préstamos de la matriz.
- KID en español (17:16:35 UTC, SHA-256 igual): riesgo 7 de 7; 1 año;
  «Importe mínimo de inversión no aplicable»; USDC; greenlist; 15 % y 50 %;
  valor tras un día hábil; gestión 0,00 %, éxito 5 %, reembolso inmediato
  0,07 %; sin mercado; «no está autorizada ni supervisada» como entidad
  financiera.
- ESMA (17:16:47 UTC): 3 documentos del ISIN CH1371002986, el último FTWS del
  17/07/2026 con SPAIN; 41 del emisor, folletos BPWO-84, -63 y -45, sin
  suplementos. CNMV pasaportes (17:16:55 UTC): BPWO-84 notificado el
  17/07/2026.
- Advertencias de la CNMV «Midas» y «Midas Software» (17:21:30–17:21:47 UTC):
  «No hay datos disponibles»; control «Gemini» con resultados.

### Kraken xStocks
- eu.kraken.com/xstocks (17:17:29 UTC) y /es/xstocks (17:17:53 UTC): «más de
  1.000», «tan solo 1 EUR», «clientes de PEDSL-CY ubicados en la UE que hayan
  completado con éxito la evaluación», venta a USD o retirada a monedero,
  24/5, «El emisor de xStocks no está afiliado al Grupo Kraken», CySEC 342/17.
- Folleto base (MFSA), segundo suplemento y condiciones finales de LITEx
  (17:19:09 UTC): SHA-256 iguales a los publicados (`47be9272…`,
  `acb0376b…`, `85b56d11…`). Folleto: «not profitable», «only suitable for
  acquisition by a person who…»; suplemento: «both group companies of the
  Issuer».
- ESMA (17:18:59 UTC): 1.732 documentos del emisor, el último FTWS-2878 del
  19/11/2026; sin suplementos después del SUPP-68 (29/09/2026). Condiciones
  finales de ANTx: solo Liechtenstein y Suiza.
- CNMV ESI 4474 (17:18:53 UTC): PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED,
  05/01/2018. CNMV pasaportes: BPWO-80 notificado el 11/05/2026. CySEC: 342/17,
  eu.kraken.com, España en la lista.
- Tabla de comisiones en inglés (17:17:29–17:17:41 UTC): «1% trading fee on
  instant…», «Small instant trades carry a fee of up to $2», spread sin cifra;
  la española no trae esa línea en el HTML. Aviso de riesgos: «BY INVESTING IN
  xSTOCKS, YOU CAN LOSE YOUR ENTIRE INVESTMENT.», «Updated : 27 January 2026».
- Preguntas frecuentes: «Net Dividend (after applicable withholding tax, which
  is 30% …)». Advertencias de la CNMV «Kraken», «Payward», «Backed» y
  «xStocks»: sin datos.

### Robinhood Classic Stock Tokens
- Los cinco PDF (17:19:28–17:19:31 UTC) con el SHA-256 de siempre: KID inglés
  `d744e3ac…`, KID español `84f4f0a8…`, tarifas `614b0f5b…`, descripciones
  `4e3ab0a2…` y `75f905ae…`. Tarifas: «0.10% currency conversion fee for each
  transaction», sin otras comisiones. KID: 7 de 7, 1 año, contraparte única,
  sin fondo de garantía, precio en USD, puede suspender el cierre.
  Descripción en español: «El token no es transferible ni cedible».
- robinhood.com/eu/es/invest (17:19:38 UTC) y /en/ (17:20:04 UTC): «Empieza
  con tan solo 1 euro», «más de 2.000», «24/5, de lunes a viernes», «no se
  pueden enviar a otros monederos».
- CNMV ESI 5299 (17:19:56 UTC): ROBINHOOD EUROPE, UAB, 21/04/2025. Banco de
  Lituania: LB002288, LB002294, LB002341 (2025-04-03, 2025-05-29, 2026-03-12).
  Lista CASP de la CNMV (`0dea9e14…`) y CSV de ESMA (`d6ba2696…`): Robinhood
  sigue. Advertencias de la CNMV «Robinhood»: sin datos.

### Prosegur Digital Gold
- prosegurcrypto.com/digital-gold (17:20:26 UTC): «Compra mínima ✔ 1 gramo»;
  custodia en Vicálvaro (Madrid), según una nota de prensa enlazada en la
  página, lo que respalda «en España».
- Contrato (17:20:18 UTC): «Actualizado el 08/07/2026»; «Precio LBMA diario +
  4%» y «- 6%»; «1 a 7 días hábiles aproximadamente»; suspensión y «montos
  máximos diarios o mensuales»; «NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN
  REGULADOR FINANCIERO»; «NO GARANTIZA NI RENTABILIDAD NI UN VALOR FIJO»;
  euros para residentes del EEE. Ida y vuelta: 1 − 0,94/1,04 = 9,6 % → «cerca
  de un 10 %», correcto.
- Contraste: la app da 107,74 € por gramo (17:20:46 UTC) con el oro a
  3.219,17 €/onza (17:20 UTC) → 103,50 € por gramo × 1,04 = 107,64 €: cuadra
  con LBMA + 4 %.
- Lista CASP de la CNMV (17:21:23 UTC): PROSEGUR CUSTODIA DE ACTIVOS
  DIGITALES, S.L., 30/06/2026. CSV de ESMA: misma fila, servicios a, g y j.
  Advertencias de la CNMV «Prosegur» y «Prosegur Custodia»: sin datos.

## Sin poder comprobar

- midas.app y docs.midas.app (mtbill, products, llms.txt, llms-full.txt,
  eligibility-and-compliance, tokens/mtbill, el JS main-DOxid0Zj.js y la
  portada): 403 a las 17:17:03–17:17:05 UTC. No se insistió. Quedan sin
  comprobar hoy el botón «Ver fuente» de mTBILL y las referencias de la ficha
  que salen de esas páginas (comisiones del 21/09, TVL del 30/09, descripciones
  del 20–22/10, acceso del 01/11 y países del 05/11).
- etherscan.io (página del oráculo): 403 con `cf-mitigated: challenge`. El dato
  se leyó en cadena por el nodo público.
- El aviso editorial común («Referencia editorial gratuita…») no tiene fuente
  externa.
- Robinhood: el «comunicado del proveedor del 22/06/2026» que cita la
  referencia de acceso no se buscó.
- Kraken: assets.backed.fi (documentos del emisor) no se abrió; la API de la
  FMA de Liechtenstein tampoco.
- Prosegur: no hay informes de auditoría ni póliza enlazados que leer.
