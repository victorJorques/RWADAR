# Qué cambia en la entrega 2026-11-21 (frente a la 2026-11-20.2)

Generado por el motor (`motor.mjs revisar 2026-11-21`) a partir de decisiones.json, el contraste y los dos SQL. Es el punto de partida de la revisión: cada revisor sigue haciendo sus propias pruebas.

- SQL de hoy: `aplicar-y-aprobar.sql` SHA-256 `1f892b7608789ce6410979b4158815c1c62ff4f112711430b47b68c73075e9bd`, revisión `753b4cc9-3c01-e879-ba96-05dc3cf95b05`.
- Parte de la publicada `94f7fd5d-f6e5-c28e-1c31-a6ea5a5f38d7` (huella `94f7fd5df6e5c28e…`); último día vigente 28/11/2026.
- Inventario: las mismas filas por tabla que ayer (35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias del SQL que cambian algo más que la revisión, la huella y la fecha del día: **23** de 288.

## Cambios por ficha (425 en 22 fichas)

### spiko-letras-del-tesoro-euro

- rentabilidad: «2,45 % · Rendimiento neto anualizado de los últimos 31 días publicado por Spiko el 20/11/2026 (VL calculada el 20/11/2026, que Spiko fecha el 22/11/2026 porque cubre el fin de semana); consultado el 20/11/2026. Variable y no garantizado.» → «2,45 % · Rendimiento neto anualizado de los últimos 31 días que publica Spiko con el valor liquidativo calculado el viernes 20/11/2026; consultado el 21/11/2026. Variable y no garantizado.»
- métrica: «Riesgo KID: 1 de 7» → «Riesgo KID: 1 de 7, sin contar los riesgos del registro en blockchain y de la cartera digital (el KID los deja fuera)»
- referencia de la ficha: «Suscripción inicial mínima publicada: 1 EUR» → (se quita)
- referencia de la ficha: «Suscripción inicial mínima: 1 EUR» → (se quita)
- referencia de la ficha: «Suscripción inicial publicada · 22/10/2026: 1 EUR» → (se quita)
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → (se quita)
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Minimum initial subscription 1 EUR · Minimum subsequent 1 EUR · redeemed 1 EUR» → (se quita)
- referencia de la ficha: «Comisión de gestión · 22/10/2026: 0,25 %» → «Comisión de gestión · 21/11/2026: 0,25 %»
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs» → «Estado de la oferta · consulta 21/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año. Este porcentaje se basa en los costes reales del último año.» → «Comisiones · consulta 21/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año. Este porcentaje se basa en los costes reales del último año.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Depositario: CACEIS Bank ... los activos del Producto conservados por el depositario no se verán afectados» → «Custodia · consulta 21/11/2026: Depositario: CACEIS Bank ... los activos del Producto conservados por el depositario no se verán afectados»
- referencia de la ficha: «Reembolso inmediato · consulta 01/11/2026: Instant transfers are supported for amounts up to €500,000 per day» → «Reembolso inmediato · consulta 21/11/2026: Instant transfers are supported for amounts up to €500,000 per day»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7 ... El capital no está garantizado» → «Riesgos · consulta 21/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7 ... El capital no está garantizado»
- referencia de la ficha: «Salida · consulta 01/11/2026: Las solicitudes ... son centralizadas por Spiko Finance a más tardar a las 11:30 (hora de París). Estas solicitudes se ejecutan sobre la base del último valor liquidativo conocido.» → «Salida · consulta 21/11/2026: Las solicitudes ... son centralizadas por Spiko Finance a más tardar a las 11:30 (hora de París). Estas solicitudes se ejecutan sobre la base del último valor liquidativo conocido.»
- referencia de la ficha: «Acceso desde España (particulares) · consulta 01/11/2026: Customer: a Customer may be a natural person with full legal capacity ... (i) a consumer» → «Acceso desde España (particulares) · consulta 21/11/2026: Customer: a Customer may be a natural person with full legal capacity ... (i) a consumer»
- referencia de la ficha: «Rentabilidad publicada · 31 días: 2,45 %» → «Rentabilidad publicada · 31 días: 2,45 %»

### spiko-letras-del-tesoro-dolar

- rentabilidad: «4,00 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 20/11/2026 (VL del 20/11/2026); consultado el 20/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.» → «4,00 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 20/11/2026 (VL del 20/11/2026); consultado el 21/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.»
- métrica: «Riesgo KID: 1 de 7, más riesgo de cambio» → «Riesgo KID: 1 de 7, más riesgo de cambio, sin contar los riesgos del registro en blockchain y de la cartera digital (el KID los deja fuera)»
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs» → «Estado de la oferta · consulta 21/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: USD Share FR001400ODM9 ... 1 USD 1 USD 1 USD All investors» → (se quita)
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año» → «Comisiones · consulta 21/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año»
- referencia de la ficha: «Moneda y tipo de cambio · consulta 01/11/2026: Atención al riesgo de cambio ... la ganancia final dependerá del tipo de cambio entre ambas monedas. Este riesgo no se tiene en cuenta en el indicador anterior.» → «Moneda y tipo de cambio · consulta 21/11/2026: Atención al riesgo de cambio ... la ganancia final dependerá del tipo de cambio entre ambas monedas. Este riesgo no se tiene en cuenta en el indicador anterior.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Depositario: CACEIS Bank» → «Custodia · consulta 21/11/2026: Depositario: CACEIS Bank»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7» → «Riesgos · consulta 21/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7»
- referencia de la ficha: «Patrimonio y partícipes · consulta 01/11/2026: totalAssets 171243227.21 USD · numberOfHolders 857» → (se quita)
- referencia de la ficha: «Rentabilidad publicada · 31 días: 4,00 %» → «Rentabilidad publicada · 31 días: 4,00 %»
- fuentes de la oferta: «https://www.spiko.io/es/spiko-letras-del-tesoro-dollar · https://data.spiko.io/ustbl/ · https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf · https://docs.spiko.io/documentation/product_overview/fund_availability · https://geco.amf-france.org/produit-d-epargne/c79398» → «https://www.spiko.io/es/spiko-letras-del-tesoro-dollar · https://data.spiko.io/ustbl/ · https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf · https://docs.spiko.io/documentation/product_overview/fund_availability · https://geco.amf-france.org/produit-d-epargne/c79398 · https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es»
- referencia de la ficha: (nuevo) → «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026) · IIC comunitaria (Francia)»
- fuente de la ficha: (nuevo) → «https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es»

### spiko-smart-cash-euro

- rentabilidad: «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 20/11/2026 (consultado el 20/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.» → «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 20/11/2026 (consultado el 21/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.»
- métrica: «Supervisor: AMF (Francia): n.º SCV20260075, según el certificado de la AMF del 23/02/2026; el 20/11/2026 el fondo ya no aparece en la base pública de la AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España» → «Supervisor: AMF (Francia): n.º SCV20260075, según el certificado de la AMF del 23/02/2026; desde el 20/11/2026 el fondo no aparece en la base pública de la AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España»
- referencia de la ficha: «Comisión de gestión: 0,25 % anual; gastos de funcionamiento de hasta el 0,10 %; sin comisión de entrada ni de salida» → «Comisión de gestión: 0,25 % anual; gastos de funcionamiento de hasta el 0,10 %; sin comisión de entrada ni de salida»
- referencia de la ficha: «Riesgo (KID): 1 de 7, sin contar el riesgo de contraparte; capital no garantizado y sin rentabilidad mínima; en los escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses (moderado: 9.990 €); plazo recomendado de 3 meses» → «Riesgo (KID): 1 de 7, sin contar el riesgo de contraparte; capital no garantizado y sin rentabilidad mínima; en los escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses (moderado: 9.990 €); plazo recomendado de 3 meses»
- referencia de la ficha: «Ajuste del valor liquidativo: Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)» → «Ajuste del valor liquidativo: Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)»
- referencia de la ficha: «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026)» → «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026)»
- referencia de la ficha: «Web frente al KID: La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»» → «Web frente al KID: La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»»
- referencia de la ficha: «Rendimiento neto publicado: 2,84 %» → «Rendimiento neto publicado: 2,84 %»
- referencia de la ficha: «Aprobación del compartimento: N.º SCV20260075, en la lista de compartimentos del certificado de la AMF del 23/02/2026» → «Aprobación del compartimento: N.º SCV20260075, en la lista de compartimentos del certificado de la AMF del 23/02/2026»

### robinhood-classic-stock-tokens

- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Start with as little as €1» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: ROBINHOOD EUROPE, UAB · Empresas de Servicios de Inversión del Espacio Económico Europeo en Libre Prestación · Nº Registro Oficial 5299 · 21/04/2025» → (se quita)
- referencia de la ficha: «Salida · consulta 01/11/2026: You can request that Robinhood Europe buy it back from you at any time at the then-quoted price of the Underlying Asset, subject to applicable fees and other conditions in each case.» → (se quita)
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Classic Stock Tokens are derivative contracts between you and Robinhood. They are priced at the prices of the underlying securities without granting rights to them.» → «Qué se adquiere · consulta 21/11/2026: Classic Stock Tokens are derivative contracts between you and Robinhood. They are priced at the prices of the underlying securities without granting rights to them.»
- referencia de la ficha: «Precio · consulta 01/11/2026: Explore 2,000+ Classic Stock Tokens linked to US stocks and ETPs» → «Precio · consulta 21/11/2026: Explore 2,000+ Classic Stock Tokens linked to US stocks and ETPs»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Your rights under the Product come from your contract with Robinhood Europe, and are also represented by a blockchain-traded token (the 'Token'), issued to you at the time of entering into the contract.» → «Qué se adquiere · consulta 21/11/2026: Your rights under the Product come from your contract with Robinhood Europe, and are also represented by a blockchain-traded token (the 'Token'), issued to you at the time of entering into the contract.»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Robinhood Europe applies a 0.10% currency conversion fee for each transaction ... Robinhood Europe does not apply any other fees related to the trading of Classic Stock Tokens.» → «Comisiones · consulta 21/11/2026: Robinhood Europe applies a 0.10% currency conversion fee for each transaction ... Robinhood Europe does not apply any other fees related to the trading of Classic Stock Tokens.»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: We have classified this Product as 7 out of 7, which is the highest risk class.» → «Riesgos · consulta 21/11/2026: We have classified this Product as 7 out of 7, which is the highest risk class.»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: The product is not covered by an investor compensation or deposit insurance scheme. Robinhood Europe is the sole counterparty to payment claims arising from the Product» → «Riesgos · consulta 21/11/2026: The product is not covered by an investor compensation or deposit insurance scheme. Robinhood Europe is the sole counterparty to payment claims arising from the Product»
- referencia de la ficha: «Custodia · consulta 01/11/2026: although Robinhood hedges its obligations by purchasing US shares or ETPs for its own account on a 1:1 basis with the US Share Derivatives it issues» → «Custodia · consulta 21/11/2026: although Robinhood hedges its obligations by purchasing US shares or ETPs for its own account on a 1:1 basis with the US Share Derivatives it issues»
- tarjeta (fecha del dato): «Mínimo de inversión: Desde 1 € · dato del 2026-11-01» → «Mínimo de inversión: Desde 1 € · dato del sin fecha»

### mtbill

- referencia de la ficha: «Comisión publicada · Gestión: 0 %» → (se quita)
- referencia de la ficha: «Comisión publicada · Performance: 5 % sobre el rendimiento» → (se quita)
- referencia de la ficha: «TVL publicado en Midas: $76.36M» → (se quita)
- referencia de la ficha: «Descripción en el índice oficial de productos · 20/10/2026: «The mTBILL token tracks the performance of short-dated US Treasury Bills, making it an ideal alternative for any stablecoin use case.»» → (se quita)
- referencia de la ficha: «Descripción en el índice oficial de productos · 21/10/2026: «The mTBILL token tracks the performance of short-dated US Treasury Bills, making it an ideal alternative for any stablecoin use case.»» → (se quita)
- referencia de la ficha: «Descripción en el índice oficial de productos · 22/10/2026: «The mTBILL token tracks the performance of short-dated US Treasury Bills, making it an ideal alternative for any stablecoin use case.»» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: U.S. Persons… Sanctioned Jurisdictions… Restricted Countries: Users from jurisdictions that Midas deems to pose an unacceptable legal or regulatory risk will be blocked.» → (se quita)
- referencia de la ficha: «Países de oferta según la web de Midas · consulta 05/11/2026: España figura entre las 14 jurisdicciones permitidas del aviso de entrada de la web de Midas (versión 1.0.2), las mismas 14 de oferta pública de las Condiciones Finales» → (se quita)
- referencia de la ficha: «Países de oferta pública · Condiciones Finales del 17/07/2026: Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany» → «Países de oferta pública · Condiciones Finales del 17/07/2026: Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany»
- fuente de la ficha: «https://midas.app/products» → (se quita)
- fuente de la ficha: «https://midas.app/llms.txt» → (se quita)
- fuente de la ficha: «https://midas.app/» → (se quita)
- fuente de la ficha: «https://docs.midas.app/tokens/mtbill» → (se quita)
- fuente de la ficha: «https://docs.midas.app/legal/eligibility-and-compliance» → (se quita)

### prosegur-digital-gold

- referencia de la ficha: «Unidad descrita: 1 gramo de oro físico por token» → (se quita)
- referencia de la ficha: «Compra mínima publicada: 1 gramo» → (se quita)
- referencia de la ficha: «Custodia publicada: Sin tarifas de custodia según el proveedor» → (se quita)
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → (se quita)
- referencia de la ficha: «Compra mínima publicada · 22/10/2026: 1 gramo» → (se quita)
- referencia de la ficha: «Custodia publicada · 22/10/2026: Sin tarifas de custodia según el proveedor» → (se quita)
- referencia de la ficha: «Liquidación publicada: Menos de 24 horas según el proveedor» → (se quita)
- referencia de la ficha: «Liquidación publicada · 22/10/2026: Menos de 24 horas según el proveedor» → (se quita)
- referencia de la ficha: «Auditorías publicadas: Mensuales y certificadas según el proveedor» → (se quita)
- referencia de la ficha: «Auditorías publicadas · 22/10/2026: Mensuales y certificadas según el proveedor» → (se quita)
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Compra mínima ✔ 1 gramo» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 02/11/2026: todas las transacciones económicas se realizarán en EUROS para los Clientes residentes en el Espacio Económico Europeo» → (se quita)
- referencia de la ficha: «Costes publicados de compra y venta: Compra: LBMA +4%; venta: LBMA −6%» → «Costes publicados de compra y venta: Compra: LBMA +4%; venta: LBMA −6%»
- referencia de la ficha: «Salida y plazo contractual publicados: Solo recompra por Prosegur; procesamiento normal aproximado de 1 a 7 días hábiles» → «Salida y plazo contractual publicados: Solo recompra por Prosegur; procesamiento normal aproximado de 1 a 7 días hábiles»
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Precio de compra ... Comprar (app); «Empieza hoy mismo» (web)» → «Estado de la oferta · consulta 21/11/2026: Precio de compra 107,88 € · Emitida · Comprar (app); «Empieza hoy mismo» (web)»
- referencia de la ficha: «Qué se adquiere · consulta 02/11/2026: Los Tokens de Oro confieren derechos sobre una cantidad equivalente de oro físico segregado mantenido dentro de un inventario fungible» → «Qué se adquiere · consulta 21/11/2026: Los Tokens de Oro confieren derechos sobre una cantidad equivalente de oro físico segregado mantenido dentro de un inventario fungible»
- referencia de la ficha: «Supervisión · consulta 02/11/2026: SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO» → «Supervisión · consulta 21/11/2026: SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO»
- referencia de la ficha: «Comisiones · consulta 02/11/2026: Compra de tokens ... Precio LBMA diario + 4% · Venta de tokens ... Precio LBMA diario - 6%» → «Comisiones · consulta 21/11/2026: Compra de tokens ... Precio LBMA diario + 4% · Venta de tokens ... Precio LBMA diario - 6%»
- referencia de la ficha: «Custodia · consulta 02/11/2026: El Oro Físico ... será almacenado en instalaciones de custodia de alta seguridad de Prosegur Crypto (o en las de terceros custodios especialmente designados)» → «Custodia · consulta 21/11/2026: El Oro Físico ... será almacenado en instalaciones de custodia de alta seguridad de Prosegur Crypto (o en las de terceros custodios especialmente designados)»
- referencia de la ficha: «Rentabilidad · consulta 02/11/2026: PROSEGUR CRYPTO NO GARANTIZA NI RENTABILIDAD NI UN VALOR FIJO DE LOS TOKENS DE ORO» → «Rentabilidad · consulta 21/11/2026: PROSEGUR CRYPTO NO GARANTIZA NI RENTABILIDAD NI UN VALOR FIJO DE LOS TOKENS DE ORO»
- referencia de la ficha: «Fiscalidad · consulta 02/11/2026: Los Tokens de Oro suponen una entrega de oro de inversión exenta de IVA de acuerdo con lo dispuesto en el artículo 140. Bis de la Ley de IVA» → «Fiscalidad · consulta 21/11/2026: Los Tokens de Oro suponen una entrega de oro de inversión exenta de IVA de acuerdo con lo dispuesto en el artículo 140. Bis de la Ley de IVA»
- tarjeta (fecha del dato): «Mínimo de inversión: 1 gramo de oro · dato del 2026-11-01» → «Mínimo de inversión: 1 gramo de oro · dato del sin fecha»
- aviso: «Prosegur Crypto está autorizada por la CNMV (MiCA, 30/06/2026) para custodiar y transferir criptoactivos; esa autorización no cubre este token de oro.» → (se quita)
- aviso: (nuevo) → «Prosegur Crypto figura en la CNMV solo para custodiar, tramitar órdenes y transferir criptoactivos; su contrato dice que este oro no está supervisado.»

### aktionariat

- métrica: «Precio del emisor · 20/11/2026: 7,25 CHF por acción (fijo)» → «Precio del emisor · 21/11/2026: 7,25 CHF por acción (fijo)»
- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026)»
- aviso: «Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el 20/11/2026).» → (se quita)
- aviso: (nuevo) → «Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el 21/11/2026 la venta más barata era de 6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF.»
- referencia de la ficha: «Moneda · 22/10/2026: CHF» → (se quita)
- referencia de la ficha: «Última operación publicada · 22/10/2026: 7,25 CHF (14/10/2026)» → (se quita)
- referencia de la ficha: «Última inversión directa del emisor · 22/10/2026: 7,25 ZCHF (14/10/2026)» → (se quita)
- referencia de la ficha: «Último cruce secundario · 22/10/2026: 6,25 ZCHF (30/09/2026)» → (se quita)
- referencia de la ficha: «Capitalización publicada · 22/10/2026: 12.927.925 CHF» → (se quita)
- referencia de la ficha: «Operaciones recientes · consulta 01/11/2026: 31 Oct 2026 / 11:56 Direct Investment 7.25 ZCHF 1 DAKS» → (se quita)
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: bankTransferLimit enabled min 500» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: The public offer to purchase the shares is exclusively addressed to persons domiciled or resident in Switzerland or the EEA. … The offer for persons from the EEA is limited to a total of €100,000.» → (se quita)
- referencia de la ficha: «Verificación de identidad · consulta 01/11/2026: Register to Access Direct Investment» → (se quita)
- referencia de la ficha: «Salida · consulta 01/11/2026: Bid/Ask 6.00 / 6.20 · Spread 3.23%» → (se quita)
- referencia de la ficha: «Número de accionistas publicado · 22/10/2026: 368» → «Número de accionistas publicado · 21/11/2026: 368»
- referencia de la ficha: «Acciones tokenizadas · 22/10/2026: 800.000 DAKS de 1.800.000» → «Acciones tokenizadas · 21/11/2026: 800.000 DAKS de 1.800.000»
- referencia de la ficha: «Comisiones · consulta 05/11/2026: Entre accionistas: 0 % para quien compra y 1,9 % para quien vende» → «Comisiones · consulta 21/11/2026: Entre accionistas: 0 % para quien compra y 1,9 % para quien vende»
- referencia de la ficha: «Salida · consulta 01/11/2026: As communicated to our shareholders, the sell-side of the Brokerbot will remain disabled for the foreseeable future. Feel free to post your sell offer on our secondaries widget below.» → «Salida · consulta 21/11/2026: As communicated to our shareholders, the sell-side of the Brokerbot will remain disabled for the foreseeable future. Feel free to post your sell offer on our secondaries widget below.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None» → «Qué se adquiere · consulta 21/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None»
- referencia de la ficha: «Supervisión · consulta 01/11/2026: The secondary trading facilitated herein is considered a non-commercial trading facility … not subject to prudential supervision.» → «Supervisión · consulta 21/11/2026: The secondary trading facilitated herein is considered a non-commercial trading facility … not subject to prudential supervision.»
- referencia de la ficha: «Folleto · consulta 01/11/2026: Such offers constitute a primary offering by the issuer and are governed by the Financial Services Act in Switzerland … Once certain thresholds are reached, it is the responsibility of the issuer to publish a prospectus» → «Folleto · consulta 21/11/2026: Such offers constitute a primary offering by the issuer and are governed by the Financial Services Act in Switzerland … Once certain thresholds are reached, it is the responsibility of the issuer to publish a prospectus»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: An investment in a company is suitable only for investors who … can afford a loss of all or part of their investment.» → «Riesgos · consulta 21/11/2026: An investment in a company is suitable only for investors who … can afford a loss of all or part of their investment.»
- referencia de la ficha: (nuevo) → «Última compra al emisor · 21/11/2026: 7,25 ZCHF (1 acción, 31/10/2026)»
- referencia de la ficha: (nuevo) → «Última operación entre accionistas · 21/11/2026: 5,00 ZCHF (62 acciones, 21/11/2026)»
- referencia de la ficha: (nuevo) → «Libro entre accionistas · 21/11/2026: Mejor compra entre accionistas 5,01 ZCHF (5 acciones); 78 acciones pedidas en total»

### kraken-xstocks

- aviso: «Los dividendos no se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.» → «Los dividendos no se cobran: se suman al saldo, netos de una retención del 30 %.»
- referencia de la ficha: «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.» → «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 %»
- referencia de la ficha: «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado» → «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado»
- referencia de la ficha: «Registro del vendedor: Payward Europe Digital Solutions (CY) Limited · ESI del EEE en libre prestación · n.º 4474» → «Registro del vendedor: Payward Europe Digital Solutions (CY) Limited · ESI del EEE en libre prestación · n.º 4474»
- referencia de la ficha: «Licencia del vendedor: CySEC, licencia 342/17» → «Licencia del vendedor: CySEC, licencia 342/17»
- referencia de la ficha: «Comisión con euros: 1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica» → «Comisión con euros: 1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica»
- referencia de la ficha: «Situación del emisor: No es rentable, depende de la financiación de su grupo y avala un préstamo de su matriz» → «Situación del emisor: No es rentable, depende de la financiación de su grupo y avala un préstamo de su matriz»
- tarjeta (fecha del dato): «Mínimo de inversión: Desde 1 € · dato del sin fecha» → «Mínimo de inversión: Desde 1 € · dato del sin fecha»
- tarjeta (fecha del dato): «Acceso desde España: Según Kraken UE, disponible para sus clientes en la UE que superen su evaluación o sean inversores profesionales · dato del sin fecha» → «Acceso desde España: Según Kraken UE, disponible para sus clientes en la UE que superen su evaluación o sean inversores profesionales · dato del sin fecha»
- tarjeta (fecha del dato): «Salida: Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a tu wallet; sin plazo fijo · dato del sin fecha» → «Salida: Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a tu wallet; sin plazo fijo · dato del sin fecha»

### boss-info

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026)»
- aviso: «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 20/11/2026).» → «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 21/11/2026).»
- tarjeta: «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 20/11)» → «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 21/11)»
- referencia de la ficha: «Accionistas publicados: 155» → (se quita)
- referencia de la ficha: «Acciones tokenizadas publicadas: 10.650.100 BOSS» → (se quita)
- referencia de la ficha: «Moneda · 22/10/2026: CHF» → (se quita)
- referencia de la ficha: «Capitalización publicada · 22/10/2026: 71.280.824 CHF» → (se quita)
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: bankTransferLimit enabled min 100» → (se quita)
- referencia de la ficha: «Número de accionistas publicado · 22/10/2026: 155» → «Número de accionistas publicado · 21/11/2026: 155»
- referencia de la ficha: «Acciones tokenizadas · 22/10/2026: 10.650.100 BOSS» → «Acciones tokenizadas · 21/11/2026: 10.650.100 BOSS»
- referencia de la ficha: «Última operación · 20/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)» → «Última operación · 21/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)»
- referencia de la ficha: «Salida · consulta 01/11/2026: Bid/Ask 7.30 / 8.40 · Spread 13.10%» → (se quita)
- referencia de la ficha: «Salida · consulta 01/11/2026: Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert.» → «Salida · consulta 21/11/2026: Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None» → «Qué se adquiere · consulta 21/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None»
- referencia de la ficha: «Supervisión · consulta 01/11/2026: not subject to prudential supervision» → «Supervisión · consulta 21/11/2026: not subject to prudential supervision»
- referencia de la ficha: (nuevo) → «Salida · 21/11/2026: Bid/Ask 7.30 / 8.40 · Spread 13.10%»

### switzerlend

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026); afiliada a PolyReg solo a efectos de blanqueo» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026); afiliada a PolyReg solo a efectos de blanqueo»
- métrica: «Clase: Preferente C1 (preferencia en liquidación)» → «Clase: Preferente C1: en una venta o liquidación, si el dinero alcanza, cobra 53,72 CHF por acción detrás de las preferentes de rango superior y antes que las ordinarias (no es un tope)»
- aviso: «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 20/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).» → «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 21/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).»
- aviso: «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 20/11/2026).» → «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 21/11/2026).»
- tarjeta: «Mínimo de inversión: 1 acción (68,01 CHF el 20/11)» → «Mínimo de inversión: 1 acción (68,01 CHF el 21/11, precio del emisor)»
- referencia de la ficha: «Último cruce documentado: 68,01 CHF» → (se quita)
- referencia de la ficha: «Último cruce publicado: 68,01 CHF» → (se quita)
- referencia de la ficha: «Accionistas publicados: 285» → (se quita)
- referencia de la ficha: «Acciones tokenizadas publicadas: 27.277 LENDS · clase C1» → (se quita)
- referencia de la ficha: «Moneda · 22/10/2026: CHF» → (se quita)
- referencia de la ficha: «Última operación publicada · 22/10/2026: 68,01 CHF (07/10/2026)» → (se quita)
- referencia de la ficha: «Última inversión directa del emisor · 22/10/2026: 68,01 ZCHF (07/10/2026)» → (se quita)
- referencia de la ficha: «Último cruce secundario · 22/10/2026: 67,00 ZCHF (25/08/2026)» → (se quita)
- referencia de la ficha: «Capitalización publicada (toda la empresa) · 22/10/2026: 48.409.858 CHF» → (se quita)
- referencia de la ficha: «Operaciones recientes · consulta 01/11/2026: 7 Oct 2026 / 13:34 Direct Investment 68.01 ZCHF 10 LENDS» → (se quita)
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Total: 408.07 CHF» → (se quita)
- referencia de la ficha: «Salida · consulta 01/11/2026: Bid/Ask 59.00 / 67.50 · Spread 12.59%» → (se quita)
- referencia de la ficha: «Número de accionistas publicado · 22/10/2026: 286» → «Número de accionistas publicado · 21/11/2026: 286»
- referencia de la ficha: «Acciones tokenizadas · 22/10/2026: 27.277 LENDS de 31.066» → «Acciones tokenizadas · 21/11/2026: 27.277 LENDS de 31.066»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: All Share Tokens are issued as preferred C1 shares with a nominal value of CHF 1.00 and which have the Liquidation Preferences» → «Qué se adquiere · consulta 21/11/2026: All Share Tokens are issued as preferred C1 shares with a nominal value of CHF 1.00 and which have the Liquidation Preferences»
- referencia de la ficha: (nuevo) → «Última compra al emisor · 21/11/2026: 68,01 ZCHF (10 + 1 acciones, 07/10/2026)»
- referencia de la ficha: (nuevo) → «Última operación entre accionistas · 21/11/2026: 67,00 ZCHF (1 acción, 25/08/2026)»
- referencia de la ficha: (nuevo) → «Salida · 21/11/2026: Bid/Ask 59.00 / 67.00 · Spread 11.94%»

### vivienda-pluddemanngasse-101-graz

- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)» → «Venta más barata · 21/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 335» → «Participaciones en venta · 21/11/2026: 335»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 20,00 € (1 participación, orden del 23/04/2026)» → «Mejor oferta de compra · 21/11/2026: 20,00 € (1 participación, orden del 23/04/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 103,37» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 103,37»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 103,37» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 103,37»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### vivienda-sonnleithnergasse-2-viena

- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)» → «Venta más barata · 21/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 80,00 € (81,20 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 80,00 € (81,20 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 97» → «Participaciones en venta · 21/11/2026: 97»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 65,00 € (2 participaciones en 2 órdenes; la más antigua del 16/10/2026)» → «Mejor oferta de compra · 21/11/2026: 65,00 € (2 participaciones en 2 órdenes; la más antigua del 16/10/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 101,37» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 101,37»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 101,37» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 101,37»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### local-de-estanco-klagenfurt

- tarjeta: «Mínimo de inversión: Desde 95 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 95 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)» → «Venta más barata · 21/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 299» → «Participaciones en venta · 21/11/2026: 299»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 15,00 € (1 participación, orden del 21/09/2026)» → «Mejor oferta de compra · 21/11/2026: 15,00 € (1 participación, orden del 21/09/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,02» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,02»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,02» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,02»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### vivienda-stallhofstra-e-28-gratwein

- tarjeta: «Mínimo de inversión: Desde 68,80 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 68,80 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 68,80 € por participación (1 a ese precio, orden del 08/11/2026)» → «Venta más barata · 21/11/2026: 68,80 € por participación (1 a ese precio, orden del 08/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 68,80 € (69,83 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 68,80 € (69,83 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 315» → «Participaciones en venta · 21/11/2026: 315»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 30,00 € (1 participación, orden del 01/07/2026)» → «Mejor oferta de compra · 21/11/2026: 30,00 € (1 participación, orden del 01/07/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,10» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,10»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,10» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,10»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### vivienda-schwarzer-weg-18-graz

- tarjeta: «Mínimo de inversión: Desde 69,90 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 71,00 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 69,90 € por participación (1 a ese precio, orden del 27/10/2026)» → «Venta más barata · 21/11/2026: 71,00 € por participación (1 a ese precio, orden del 21/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 69,90 € (70,95 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 71,00 € (72,07 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 298» → «Participaciones en venta · 21/11/2026: 298»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 62,00 € (1 participación, orden del 17/11/2026)» → «Mejor oferta de compra · 21/11/2026: 62,00 € (1 participación, orden del 17/11/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,14» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,14»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,14» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,14»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### drautalresidenz-paternion

- tarjeta: «Mínimo de inversión: Desde 70 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 70 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 70,00 € por participación (1 a ese precio, orden del 17/11/2026)» → «Venta más barata · 21/11/2026: 70,00 € por participación (1 a ese precio, orden del 17/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 147» → «Participaciones en venta · 21/11/2026: 147»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 50,00 € (1 participación, orden del 29/09/2026)» → «Mejor oferta de compra · 21/11/2026: 50,00 € (1 participación, orden del 29/09/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,05» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,05»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,05» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,05»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE, pero la app no deja comprar esta emisión sin número fiscal austriaco; no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### randhartingergasse-9-viena

- tarjeta: «Mínimo de inversión: Desde 78 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 78 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 78,00 € por participación (20 a ese precio, orden del 29/06/2026)» → «Venta más barata · 21/11/2026: 78,00 € por participación (20 a ese precio, orden del 29/06/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 85,00 € (86,28 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 85,00 € (86,28 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 188» → «Participaciones en venta · 21/11/2026: 188»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 64,00 € (1 participación, orden del 12/11/2026)» → «Mejor oferta de compra · 21/11/2026: 64,00 € (1 participación, orden del 12/11/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Precio de emisión por participación (API) · 22/10/2026: 100,24 EUR» → «Precio de emisión por participación (API) · 21/11/2026: 100,24 EUR»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,24» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,24»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,24» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,24»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).» → (se quita)
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»
- aviso: «Según la API, el inquilino se fue el 28/02/2026 y se busca otro; la rentabilidad no se muestra.» → (se quita)
- aviso: (nuevo) → «Según la API, el alquiler terminó el 28/02/2026 y se buscaba otro inquilino; no consta si ya lo hay. Si sigue vacía, puede no haber repartos. La rentabilidad no se muestra.»

### apartamento-vacacional-hinterstoder-50

- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 75,00 € por participación (5 a ese precio, orden del 08/11/2026)» → «Venta más barata · 21/11/2026: 75,00 € por participación (5 a ese precio, orden del 08/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 82,00 € (83,23 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 82,00 € (83,23 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 252» → «Participaciones en venta · 21/11/2026: 252»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)» → «Mejor oferta de compra · 21/11/2026: 20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: indefinido» → «Plazo · 21/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,20» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,20»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,20» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,20»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).» → (se quita)
- aviso: (nuevo) → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### vivienda-pottendorfer-stra-e-62-wr-neustadt

- tarjeta: «Mínimo de inversión: Desde 81 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 81 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 81,00 € por participación (1 a ese precio, orden del 15/11/2026)» → «Venta más barata · 21/11/2026: 81,00 € por participación (1 a ese precio, orden del 15/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 81,00 € (82,22 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 81,00 € (82,22 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 96» → «Participaciones en venta · 21/11/2026: 96»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 64,00 € (1 participación, orden del 17/11/2026)» → «Mejor oferta de compra · 21/11/2026: 64,00 € (1 participación, orden del 17/11/2026)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,44» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,44»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,44» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,44»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussschein ... läuft grundsätzlich endlos/ewig ("Perpetual")» → «Qué se adquiere · consulta 21/11/2026: Genussschein ... läuft grundsätzlich endlos/ewig ("Perpetual")»
- referencia de la ficha: «Salida · consulta 01/11/2026: die ordentliche Kündigung ist erstmals nach 15 (fünfzehn) Jahren ab dem Ausgabetag und sodann alle ...» → «Salida · consulta 21/11/2026: die ordentliche Kündigung ist erstmals nach 15 (fünfzehn) Jahren ab dem Ausgabetag und sodann alle ...»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE (España incluida); esta emisión no pide número fiscal austriaco, pero no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.»

### fotovoltaica-greenpoint

- tarjeta: «Mínimo de inversión: Desde 102 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 102 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 102,00 € por participación (8 a ese precio, en 3 órdenes de 5, 2, 1)» → «Venta más barata · 21/11/2026: 102,00 € por participación (8 a ese precio, en 3 órdenes de 5, 2, 1)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 347» → «Participaciones en venta · 21/11/2026: 347»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 29,00 € (1 participación, orden del 10/08/2024)» → «Mejor oferta de compra · 21/11/2026: 29,00 € (1 participación, orden del 10/08/2024)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: hasta el 31/12/2038» → «Plazo · 21/11/2026: hasta el 31/12/2038»
- referencia de la ficha: «Distribuciones esperadas desde · 22/10/2026: 15/02/2024» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,32» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,32»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,32» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,32»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.» → «Qué se adquiere · consulta 21/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Laufzeit von 15 Jahren ("endfällig")» → «Salida · consulta 21/11/2026: Laufzeit von 15 Jahren ("endfällig")»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE (España incluida); esta emisión no pide número fiscal austriaco, pero no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.»
- aviso: «Reembolso subordinado a los acreedores financieros del emisor.» → (se quita)
- aviso: (nuevo) → «Reembolso y repartos subordinados: si el emisor es insolvente, tiene fondos propios negativos, su ratio de recursos propios baja del 8 % o se liquida, solo se cobra después de los acreedores financieros.»

### fotovoltaica-cohotel

- tarjeta: «Mínimo de inversión: Desde 110 € la participación en reventa (20/11)» → «Mínimo de inversión: Desde 110 € la participación en reventa (21/11)»
- referencia de la ficha: «Venta más barata · 20/11/2026: 110,00 € por participación (35 a ese precio, en 2 órdenes de 31, 4)» → «Venta más barata · 21/11/2026: 110,00 € por participación (35 a ese precio, en 2 órdenes de 31, 4)»
- referencia de la ficha: «Orden de venta de menor importe · 20/11/2026: 1 participación a 120,00 € (121,80 € con el 1,5 %)» → «Orden de venta de menor importe · 21/11/2026: 1 participación a 120,00 € (121,80 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 20/11/2026: 59» → «Participaciones en venta · 21/11/2026: 59»
- referencia de la ficha: «Mejor oferta de compra · 20/11/2026: 3,00 € (1 participación, orden del 23/11/2024)» → «Mejor oferta de compra · 21/11/2026: 3,00 € (1 participación, orden del 23/11/2024)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 22/10/2026: EUR» → «Moneda · 21/11/2026: EUR»
- referencia de la ficha: «Plazo · 22/10/2026: hasta el 31/12/2038» → «Plazo · 21/11/2026: hasta el 31/12/2038»
- referencia de la ficha: «Distribuciones esperadas desde · 22/10/2026: 15/02/2024» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: Ausgabepreis: EUR 100,85» → «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,85»
- referencia de la ficha: «Mínimo de inversión · consulta 01/11/2026: Mindestzeichnungsbetrag: EUR 100,85» → «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,85»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.» → «Qué se adquiere · consulta 21/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.»
- referencia de la ficha: «Salida · consulta 01/11/2026: Laufzeit von 15 Jahren ("endfällig")» → «Salida · consulta 21/11/2026: Laufzeit von 15 Jahren ("endfällig")»
- referencia de la ficha: «Riesgos · consulta 01/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 01/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 01/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: (nuevo) → «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)»
- fuente de la ficha: (nuevo) → «https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2»
- aviso: «Cuenta abierta a residentes del EEE; la distribución de esta emisión en España no está confirmada y la documentación está en alemán.» → (se quita)
- aviso: (nuevo) → «Cuenta abierta a residentes del EEE (España incluida); esta emisión no pide número fiscal austriaco, pero no consta que se comercialice en España y la documentación está en alemán.»
- aviso: (nuevo) → «El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.»
- aviso: «Reembolso subordinado a los acreedores financieros del emisor.» → (se quita)
- aviso: (nuevo) → «Reembolso y repartos subordinados: si el emisor es insolvente, tiene fondos propios negativos, su ratio de recursos propios baja del 8 % o se liquida, solo se cobra después de los acreedores financieros.»

### hausera-proximas-ofertas

- resumen: «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 2 ya está financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), tiene la preventa abierta desde el 18/11 y la suscripción anunciada del 25/11/2026 al 30/06/2027.» → «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 2 ya está financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), abrió la preventa el 18/11 y anuncia la suscripción del 25/11/2026 al 30/06/2027.»
- métrica: «Próxima operación: Alicante 3 · preventa abierta desde el 18/11/2026; suscripción del 25/11/2026 al 30/06/2027» → «Próxima operación: Alicante 3 · preventa desde el 18/11/2026; suscripción del 25/11/2026 al 30/06/2027»
- aviso: «El documento de emisión no es un folleto y la CNMV no lo ha revisado. El 20/11/2026, con la preventa ya abierta, Alicante 3 aún no estaba inscrita en el registro de la CNMV.» → (se quita)
- aviso: (nuevo) → «El documento de emisión no es un folleto y la CNMV no lo ha revisado. Alicante 3 abrió la preventa el 18/11/2026 y el 21/11/2026 aún no estaba inscrita en el registro de la CNMV.»
- tarjeta: «Mínimo de inversión: Desde 100 € en Alicante 3, según su documento de emisión (20/11); preventa abierta desde el 18/11.» → «Mínimo de inversión: Desde 100 € en Alicante 3 (documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.»
- referencia de la ficha: «Destino de consulta comprobado: Plataforma inmobiliaria Hausera» → (se quita)
- referencia de la ficha: «Historial publicado · 20/11/2026: 42 operaciones, 24 terminadas, 128 M€ financiados» → «Historial publicado · 21/11/2026: 42 operaciones, 24 terminadas, 128 M€ financiados»

## Tarjetas que cambian (14)

- boss-info: Mínimo de inversión: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 20/11)» → «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 21/11)»
- switzerlend: Mínimo de inversión: «1 acción (68,01 CHF el 20/11)» → «1 acción (68,01 CHF el 21/11, precio del emisor)»
- hausera-proximas-ofertas: Mínimo de inversión: «Desde 100 € en Alicante 3, según su documento de emisión (20/11); preventa abierta desde el 18/11.» → «Desde 100 € en Alicante 3 (documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.»
- vivienda-pluddemanngasse-101-graz: Mínimo de inversión: «Desde 75 € la participación en reventa (20/11)» → «Desde 75 € la participación en reventa (21/11)»
- vivienda-sonnleithnergasse-2-viena: Mínimo de inversión: «Desde 75 € la participación en reventa (20/11)» → «Desde 75 € la participación en reventa (21/11)»
- local-de-estanco-klagenfurt: Mínimo de inversión: «Desde 95 € la participación en reventa (20/11)» → «Desde 95 € la participación en reventa (21/11)»
- vivienda-stallhofstra-e-28-gratwein: Mínimo de inversión: «Desde 68,80 € la participación en reventa (20/11)» → «Desde 68,80 € la participación en reventa (21/11)»
- vivienda-schwarzer-weg-18-graz: Mínimo de inversión: «Desde 69,90 € la participación en reventa (20/11)» → «Desde 71,00 € la participación en reventa (21/11)»
- drautalresidenz-paternion: Mínimo de inversión: «Desde 70 € la participación en reventa (20/11)» → «Desde 70 € la participación en reventa (21/11)»
- randhartingergasse-9-viena: Mínimo de inversión: «Desde 78 € la participación en reventa (20/11)» → «Desde 78 € la participación en reventa (21/11)»
- apartamento-vacacional-hinterstoder-50: Mínimo de inversión: «Desde 75 € la participación en reventa (20/11)» → «Desde 75 € la participación en reventa (21/11)»
- vivienda-pottendorfer-stra-e-62-wr-neustadt: Mínimo de inversión: «Desde 81 € la participación en reventa (20/11)» → «Desde 81 € la participación en reventa (21/11)»
- fotovoltaica-greenpoint: Mínimo de inversión: «Desde 102 € la participación en reventa (20/11)» → «Desde 102 € la participación en reventa (21/11)»
- fotovoltaica-cohotel: Mínimo de inversión: «Desde 110 € la participación en reventa (20/11)» → «Desde 110 € la participación en reventa (21/11)»

## Sentencias del SQL que cambian (normalizado)

### bloque aprobar

- …= 'Entrega < «ETIQUETA» → «FECHA»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro'

- …últimos 31 días  «publicado por» → «que publica»
- …publicado por Spiko  «el <FECHA> (VL calculada » → «con »
- …VL calculada el  «<FECHA>, que Spiko fecha » → «valor liquidativo calculado »
- …Spiko fecha el  «22» → «viernes 20»
- … 22/11/2026 « porque cubre el fin de semana)» → «»
- …"1 de 7 «» → «, sin contar los riesgos del registro en blockchain y de la cartera digital (el KID los deja fuera)»
- …31 días ·  «<FECHA>» → «20/11/2026»
- …{"etiqueta":" «Suscripción inicial mínima publicada","valor":"1 EUR","fechaDato":null,"fechaConsulta":"2026-09-30","fuente":"https://data.spiko.io/eutbl/","alcance":"Condición mostrada durante la consulta; no prueba acceso específico desde España ni aceptación de una suscripción. Confirmar condiciones con el prove…» → «»
- …{"etiqueta":" «Suscripción inicial mínima","valor":"1 EUR","fuente":"https://data.spiko.io/eutbl/","fechaDato":null,"fechaConsulta":"2026-09-30","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado."},{"etiqueta":"» → «»
- …{"etiqueta":" «Suscripción inicial publicada · 22/10/2026","valor":"1 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://data.spiko.io/eutbl/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"et…» → «»
- …de gestión ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …oferta · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaDato":" «2026-11-01» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «El fondo sigue » → «GECO <FECHA>: »
- … fondo sigue vivo « y publica VL diaria (API: NAV 01/11/2026)» → «, todo tipo de suscriptores»
- …11/2026).  «No se ha hecho onboarding. Localizador: Ficha GECO » → «El último valor liquidativo, »
- …Ficha GECO del  «compartimento."},{"etiqueta":"Mínimo de inversión · consulta 01» → «20»
- … 01/11/2026 «","valor":"Minimum initial subscription » → « (»
- … initial subscription 1 « EUR · Minimum subsequent 1 EUR · redeemed 1 EUR","fechaDato":"2026-09-01","fechaConsulta":"2026-11-01","fuente":"https://cdn» → «,063496 €), es el que publica Spiko en su API»
- …https://cdn. «spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf","alcance":"Clase EUR FR001400ODL1. No prueba aceptación individual» → « No se ha hecho el alta»
- …individual. Localizador:  «Prospectus 01/09/2026, p. 5 y tabla «Characteristics of shares» p» → «ficha GECO del compartimento»
- … shares» p. « 35; coincide con API /share-classes (minimumInitialSubscription \» → «»
- … (minimumInitialSubscription \" «1\")."» → «»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inmediato · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …) · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"fechaDato":" «<FECHA>» → «2026-11-20»
- …liquidativo calculado el  «<FECHA>» → «20/11/2026»
- (y 1 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar'

- …por Spiko el  «<FECHA>» → «20/11/2026»
- … (VL del  «<FECHA>» → «20/11/2026»
- … riesgo de cambio «» → «, sin contar los riesgos del registro en blockchain y de la cartera digital (el KID los deja fuera)»
- …31 días ·  «<FECHA>» → «20/11/2026»
- …d-epargne/c79398" «» → «,"https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es"»
- …EN/Prospectus_Spiko_SICAV_EN.pdf" «» → «,"https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es"»
- …oferta · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaDato":" «2026-10-30» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Fondo » → «GECO <FECHA>: »
- …":"Fondo vivo « con VL diaria (API: 30/10/2026)» → «, todo tipo de suscriptores»
- …10/2026).  «Sin onboarding. Localizador: Ficha GECO » → «El último valor liquidativo, »
- …Ficha GECO del  «compartimento."},{"etiqueta":"Mínimo de inversión · consulta 01» → «20»
- … 01/11/2026 «","valor":"USD Share FR001400ODM9 ... » → « (»
- … ... 1 « USD 1 USD 1 USD All investors"» → «»
- … All investors", «"fechaDato":"2026-09-01","fechaConsulta":"2026-11-01","fuente":"https://cdn.spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf","alcance":"Conflicto en la clase EUR (FR001400SBD3» → «103573 $»
- … EUR (FR001400SBD3) «: » → «, es »
- …FR001400SBD3): el  «folleto dice 1 EUR y la » → «que publica Spiko en su »
- … y la API « de Spiko dice 1» → «»
- …Spiko dice 1. «000 EUR. No publicar mínimo en euros hasta aclararlo» → « Sin alta»
- …aclararlo. Localizador:  «Prospectus 01/09/2026, p. 5 y tabla p» → «ficha GECO del compartimento»
- …y tabla p. « 23; API minimumInitialSubscription \» → «»
- …API minimumInitialSubscription \" «1\"."» → «»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …cambio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …{"etiqueta":" «Patrimonio y partícipes · consulta 01/11/2026» → «Registro de la SICAV en España»
- …,"valor":" «totalAssets 171243227» → «Spiko SICAV · CNMV n»
- …:"totalAssets 171243227. «21 USD » → «º 2380 (30/01/2026) »
- …21 USD ·  «numberOfHolders 857» → «IIC comunitaria (Francia)»
- …fechaDato":"2026- «10» → «01»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …:"https:// «data» → «www»
- …https://data. «spiko» → «cnmv»
- …//data.spiko. «io» → «es»
- (y 8 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'spiko-smart-cash-euro' 'https://www.spiko.io/es/spiko-euro'

- …valor liquidativo del  «<FECHA>» → «20/11/2026»
- …/02/2026;  «» → «desde »
- …/2026; el  «<FECHA>» → «20/11/2026»
- …> el fondo  «ya » → «»
- …y variable ·  «<FECHA>» → «20/11/2026»
- …,"fechaDato":" «<FECHA>» → «2026-11-20»
- …valor liquidativo del  «<FECHA>» → «20/11/2026»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- … se vende.  «El <FECHA> » → «Desde el 20/11/2026 »
- …ficha del fondo  «ya » → «»
- … AMF (GECO) «» → «; el <FECHA> seguía sin aparecer»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …CNMV consultado el  «03/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …Euro consultada el  «03/11/2026» → «<FECHA>»

### rwadar_catalogo.ofertas 'robinhood-classic-stock-tokens' 'https://robinhood.com/eu/es/invest'

- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …","fechaDato": «"2026-11-01"» → «null»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …{"etiqueta":" «Mínimo de inversión · consulta 01/11/2026","valor":"Start with as little as €1","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://robinhood.com/eu/en/invest","alcance":"Cifra de la página comercial; el KID no fija mínimo. Fracciones de token Localizador: página Invest, bloque d…» → «»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …"alcance":"KID «» → « en inglés»
- …,00 %;  «posibles diferenciales» → «el KID»
- …posibles diferenciales en  «horario ampliado Localizador: Fee Schedule» → «español pone 0»
- …: Fee Schedule, « apartado Robinhood Classic Stock Tokens."},{"etiqueta":"Salida · consulta 01/11/2026","valor":"You can request that Robinhood Europe buy it back from you at any time at the then-quoted price of the Underlying Asset, subject to applicable fees and other conditions in each case.","fechaDato":"2026-07…» → «00 % »
- …el cierre de  «posiciones» → «entrada»
- … de posiciones ( «movimientos inesperados, fuera de» → «errata). Posibles diferenciales en»
- … fuera de horario «, anuncios)» → « ampliado»
- …, anuncios).  «No hay mercado secundario ni transferencia del token » → «»
- … token Localizador:  «KID p.1; p.3 «How long should I hold it»» → «Fee Schedule, apartado Robinhood Classic Stock Tokens»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …{"etiqueta":" «Acceso desde España · consulta 01/11/2026","valor":"ROBINHOOD EUROPE, UAB · Empresas de Servicios de Inversión del Espacio Económico Europeo en Libre Prestación · Nº Registro Oficial 5299 · 21/04/2025","fechaDato":"2025-04-21","fechaConsulta":"2026-11-01","fuente":"https://www.cnmv.es/portal/Consult…» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …","fechaDato": «"2026-11-01"» → «null»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …","fechaDato": «"2026-11-01"» → «null»

### rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill'

- …por token ·  «<FECHA>» → «20/11/2026»
- …semanas hasta el  «<FECHA>» → «20/11/2026»
- …16/10 al  «<FECHA>» → «20/11/2026»
- …,"https:// «midas.app/products","https://» → «»
- …docs.midas.app/ «legal/eligibility-and-compliance","https://docs.midas.app/tokens/mtbill","https://midas.app/llms.txt","https://docs.midas.app/» → «»
- …,"https:// «midas.app/","https://» → «»
- …{"etiqueta":" «Comisión publicada · Gestión","valor":"0 %","fechaDato":null,"fechaConsulta":"2026-09-21","fuente":"https://midas.app/mtbill","alcance":"Condición económica observada en la revisión del 21/09/2026. No revalidada el 27/09/2026; consultar condiciones vigentes y elegibilidad directamente con Midas."},{…» → «»
- …Países de oferta  «según la web de Midas · consulta 05/11/2026","valor":"España figura entre las 14 jurisdicciones permitidas del aviso de entrada de la web de Midas (versión 1.0.2), las mismas 14 de oferta » → «»
- …de oferta pública  «de las Condiciones Finales","fechaDato":"2026-11-05","fechaConsulta":"2026-11-05","fuente":"https://midas.app/","alcance":"Aviso «Eligibility & Jurisdiction» (versión 1.0.2) que enseña la web de Midas al entrar. Se leyó el 05/11/2026 en el código que sirve esa página (localizador: midas.app/assets/m…» → «»
- ……), leídas  «» → «de nuevo »
- … el <FECHA> «» → « (mismo archivo)»

### rwadar_catalogo.ofertas 'prosegur-digital-gold' 'https://www.prosegurcrypto.com/digital-gold'

- …:"Prosegur Crypto  «está autorizada por » → «figura en »
- …por la CNMV  «(MiCA, 30/06/2026) » → «solo »
- …2026) para custodiar « » → «, tramitar órdenes »
- … transferir criptoactivos;  «esa autorización no cubre» → «su contrato dice que»
- …no cubre este  «token de oro» → «oro no está supervisado»
- …{"etiqueta":" «Unidad descrita","valor":"1 gramo de oro físico por token","fuente":"https://www.prosegurcrypto.com/digital-gold","fechaDato":null,"fechaConsulta":"2026-09-30","alcance":"Información de la tabla comercial del proveedor consultada el 30/09/2026. No es comprobación independiente del servicio ni garant…» → «»
- …,"fechaConsulta":" «2026-10-23» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-23» → «<FECHA>»
- …oferta · consulta  «01/11/2026» → «<FECHA>»
- …Precio de compra  «... » → «107,88 € · Emitida · »
- …,"fechaDato":" «2026-11-01» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …observada en la  «» → «app y en la »
- … en la web «» → « el <FECHA>»
- …precio del gramo  «no se capturó hoy (la app carga el dato por JavaScript)» → «cambia con el oro y no va en la tarjeta»
- …). Localizador:  «Página» → «página»
- … comercial Digital Gold «, 01/11/2026» → « y app»
- …adquiere · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …Supervisión · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …{"etiqueta":" «Mínimo de inversión · consulta 01/11/2026","valor":"Compra mínima ✔ 1 gramo","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.prosegurcrypto.com/digital-gold","alcance":"No figura en los términos. No convertir a euros por nuestra cuenta. Localizador: Tabla comparativa de l…» → «»
- …Comisiones · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …Custodia · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …{"etiqueta":" «Acceso desde España · consulta 02/11/2026","valor":"todas las transacciones económicas se realizarán en EUROS para los Clientes residentes en el Espacio Económico Europeo","fechaDato":"2026-07-08","fechaConsulta":"2026-11-02","fuente":"https://app.prosegurdigitalgold.com/#/terms-service","alcance":"…» → «»
- …Rentabilidad · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …Fiscalidad · consulta  «02/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-02» → «<FECHA>»
- …","fechaDato": «"2026-11-01"» → «null»

### rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest'

- …:"Entre accionistas  «hay vendedores» → «se vende»
- … del emisor ( «6,20 ZCHF frente a » → «»
- … 7,25 CHF «» → «):»
- … el <FECHA> «)» → « la venta más barata era de 6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF»
- …{"etiqueta":" «Moneda · 22/10/2026","valor":"CHF","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://shares.aktionariat.com/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Última operac…» → «Número de accionistas publicado »
- …operación publicada ·  «22/10/2026» → «<FECHA>»
- …,"valor":" «7,25 CHF (14/10/2026)» → «368»
- …","fechaDato": «null,» → «»
- …fechaDato":null," «fechaConsulta» → «<FECHA>»
- …:null,"fechaConsulta" «:"2026-10-22"» → «»
- …10-22"," «fuente":"https://shares.aktionariat.com/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Última inversión directa del emisor · 22/10/2026","valor":"7,25 ZCHF (14/10/2026)","fechaDato":…» → «»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …,"alcance":" «Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Último cruce secundario · 22/10/2026","valor":"6,25 ZCHF » → «Portada del portal »
- …,25 ZCHF ( «30/09/2026)","fechaDato"» → «17»
- …","fechaDato": «null,"fechaConsulta"» → «44»
- …null,"fechaConsulta": «"2026-10-22","fuente":"https://shares» → «33Z)»
- …https://shares. «aktionariat.com/» → «»
- ….aktionariat.com/" «,"alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."» → «»
- …{"etiqueta":" «Capitalización publicada · 22/10/2026","valor":"12.927.925 CHF","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://shares.aktionariat.com/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.…» → «»
- …Acciones tokenizadas ·  «22/10/2026» → «<FECHA>»
- …","fechaDato": «null,» → «»
- …fechaDato":null," «fechaConsulta» → «<FECHA>»
- …:null,"fechaConsulta" «:"2026-10-22"» → «»
- …10-22"," «fuente":"https://shares.aktionariat.com/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Operaciones recientes · consulta 01/11/2026","valor":"31 Oct 2026 / 11:56 Direct Investment 7.2…» → «»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …shares.aktionariat.com/ «trade» → «»
- …,"alcance":" «Operaciones on-chain registradas por el portal. El volumen de la semana 25/10–01/11 fue 732,25 CHF. Localizador: getTrades company=77 (1.231 operaciones en total). Leído el 01/11/2026 en los datos que usa la propia web; la página enlazada es donde una persona ve ese dato, con el valor » → «Portada »
- …el valor del  «día en que la abra (comprobada el 04/11/2026)."},{"etiqueta":"Mínimo de inversión · consulta 01/11/2026","valor":"bankTransferLimit enabled min 500","fechaDato":null,"fechaConsulta":"2026-11-01","fuente":"https://shares.aktionariat.com/api/brokerbotsettings?ticker=DAKS","alcance":"Configuración técn…» → «»
- … técnica del portal «; la orden por defecto es de 100 DAKS » → « »
- … 100 DAKS ( «725 CHF). Mínimo en CHF, no en EUR. Localizador» → «17»
- … EUR. Localizador: « Datos embebidos en la portada (data-sveltekit-fetched)."},{"etiqueta"» → «44»
- …,{"etiqueta": «"Acceso desde España · consulta 01/11/2026","valor":"The public offer to purchase the shares is exclusively addressed to persons domiciled or resident in Switzerland or the EEA. … The offer for persons from the EEA is limited to a total of €100,000.","fechaDato":null,"fechaConsulta":"2026-11-01","fu…» → «33Z»
- … crean cuentas). « Localizador: Disclaimer, «Offer only valid for persons in Switzerland and the EEA».» → «»
- …{"etiqueta":" «Verificación de identidad · consulta 01/11/2026","valor":"Register to Access Direct Investment","fechaDato":null,"fechaConsulta":"2026-11-01","fuente":"https://shares.aktionariat.com/investor-page-terms","alcance":"La verificación de identidad no está activada por defecto, pero los términos permiten…» → «»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …{"etiqueta":" «Salida · consulta 01/11/2026","valor":"Bid/Ask 6.00 / 6.20 · Spread 3.23%","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://shares.aktionariat.com/trade","alcance":"Profundidad compradora total ≈118 acciones (≈ 580 ZCHF). Se liquida solo en ZCHF con monedero propio; no hay tra…» → «»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Supervisión · consulta  «01/11/2026» → «<FECHA>»
- (y 26 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'kraken-xstocks' 'https://eu.kraken.com/xstocks'

- … del 30 % « en EE» → «»
- …% en EE. « UU.» → «»
- … de Kraken UE « consultada el 03/11/2026» → «»
- … de Kraken UE « consultada el 03/11/2026» → «»
- … de Kraken UE « consultada el 03/11/2026» → «»
- …)». Las  «de LITEx (26» → «58 condiciones finales que el emisor ha publicado desde el 15»
- … LITEx (26/ «03» → «10»
- …(26/03/2026 «» → « (la última, del 19/11»
- … dicen lo mismo «» → «: ninguna incluye España (registro de ESMA, <FECHA>)»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …CNMV consultado el  «03/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …CySEC consultado el  «03/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …Kraken consultada el  «03/11/2026» → «<FECHA>»
- … del 30 % « en EE. UU.» → «»
- … 11/11/2026 «» → « y consultadas el <FECHA>: la retención del 30 % vale para las de EE»
- …11/11/2026. «» → « UU. y para las de otros mercados.»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»

### rwadar_catalogo.ofertas 'boss-info' 'https://shares.bossinfo.com/'

- …{"etiqueta":" «Accionistas publicados","valor":"155","fuente":"https://shares.bossinfo.com/","fechaDato":null,"fechaConsulta":"2026-09-30","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado."},{"etiqueta":"Acciones tok…» → «»
- …accionistas publicado ·  «22/10/2026» → «<FECHA>»
- …","fechaDato": «null» → «"<FECHA>"»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …,"alcance":" «Visto en la fuente oficial el 22/10/2026» → «Portada del portal (17:44:54Z)»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Acciones tokenizadas ·  «22/10/2026» → «<FECHA>»
- …","fechaDato": «null,» → «»
- …fechaDato":null," «fechaConsulta» → «<FECHA>»
- …:null,"fechaConsulta" «:"2026-10-22"» → «»
- …10-22"," «fuente":"https://shares.bossinfo.com/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Mínimo de inversión · consulta 01/11/2026","valor":"bankTransferLimit enabled min 100","fechaDato"…» → «»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …shares.bossinfo.com/ «api/brokerbotsettings?ticker=BOSS» → «»
- …,"alcance":" «La orden por defecto » → «Portada »
- …defecto del portal  «es de 500 BOSS » → «»
- … 500 BOSS ( «4.251,61 CHF» → «17:44:54Z»
- …,61 CHF). « Localizador: Datos embebidos en la portada.» → «»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …{"etiqueta":" «Salida · consulta 01/11/2026","valor":"Bid/Ask 7.30 / 8.40 · Spread 13.10%","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://shares.bossinfo.com/trade","alcance":"Solo ZCHF con monedero propio. La comisión del 0 % que se veía ese día era la de la compra; al vender, el 05/11/20…» → «»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Supervisión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …:"Sin advertencias  «FINMA. Sin advertencias » → «»
- …(unos 17 ZCHF « el » → «, precio a »
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- …{"etiqueta":" «» → «Salida · <FECHA>","valor":"Bid/Ask 7.30 / 8.40 · Spread 13.10%","fechaDato":"<FECHA>","fechaConsulta":"<FECHA>","fuente":"https://shares.bossinfo.com/trade","alcance":"Libro de la página de operaciones (17:45:08Z): compra 1.000 acciones a 7,30 (más 5 a 5,00 y 10 a 3,00); venta 103 a 8,40. Solo ZCHF …»
- …,"alcance":" «Última operación » → «Portada »
- …Última operación del  «mercado entre accionistas que enseña el » → «»
- … enseña el portal « del emisor» → «»
- … del emisor:  «1 acción a 8,40 ZCHF el 05/11/2026 a las 13:35 UTC. El <FECHA> la portada del portal sigue enseñándola como la última (» → «»
- …, 13:35» «). Lo que recibió quien vendió, 8,2404 ZCHF » → « »
- …,2404 ZCHF ( «la diferencia, 0,1596 ZCHF, el 1,9 %, es la comisión» → «17:44:54Z»
- …es la comisión) «, se comprobó en la cadena de bloques » → «; historial completo igual que »
- … el 13/11 «/2026 y hoy no se ha vuelto a leer» → «»

### rwadar_catalogo.ofertas 'switzerlend' 'https://shares.lend.ch/'

- …":"Preferente C1 « (preferencia » → «: »
- … (preferencia en  «» → «una venta o »
- …(preferencia en liquidación «» → «, si el dinero alcanza, cobra 53,72 CHF por acción detrás de las preferentes de rango superior y antes que las ordinarias (no es un tope»
- …{"etiqueta":" «Último cruce documentado» → «Número de accionistas publicado · <FECHA>»
- …,"valor":" «68,01 CHF» → «286»
- …,"fechaDato":" «2026-09-25» → «<FECHA>»
- …,"fechaConsulta":" «2026-09-27» → «<FECHA>»
- …,"alcance":" «Última operación mostrada durante la revisión » → «Portada »
- …la revisión del  «27/09/2026. Referencia histórica; no se garantiza ejecución ni liquidez actual» → «portal (17:45:15Z)»
- …{"etiqueta":" «Último cruce publicado» → «Acciones tokenizadas · <FECHA>»
- …,"valor":" «68,01 CHF","fuente":"https://shares» → «27»
- …https://shares. «lend.ch/","fechaDato":"2026-09-25","fechaConsulta":"2026-09-30","alcance":"Último cruce publicado a las 13:32, sin zona horaria indicada en esta lectura. No confirma un precio ejecutable hoy ni el precio » → «277 LENDS »
- …el precio de  «venta directa» → «31»
- …de venta directa. «» → «066»
- … venta directa." «}» → «»
- … directa."}, «{» → «»
- …."},{" «etiqueta» → «fechaDato»
- …{"etiqueta":" «Accionistas publicados» → «<FECHA>»
- …Accionistas publicados"," «valor» → «fechaConsulta»
- …,"valor":" «285» → «<FECHA>»
- ….ch/"," «fechaDato":null,"fechaConsulta":"2026-09-30","» → «»
- …,"alcance":" «Observación en la fuente pública » → «Portada »
- …fuente pública del  «proveedor el 30/09/2026» → «portal (17:45:15Z)»
- …30/09/2026. « No acredita ejecución, elegibilidad individual ni un resultado garantizado.» → «»
- …{"etiqueta":" «Acciones tokenizadas publicadas","valor":"27.277 LENDS » → «Qué se adquiere »
- …277 LENDS ·  «clase C1» → «consulta <FECHA>»
- …clase C1"," «fuente» → «valor»
- …,"fuente":" «https://shares.lend.ch/","fechaDato":null,"fechaConsulta":"2026-09-30","alcance":"Observación en la fuente pública del proveedor el 30/09/2026. No acredita ejecución, elegibilidad individual ni un resultado garantizado."},{"etiqueta":"Moneda · 22/10/2026» → «All Share Tokens are issued as preferred C1 shares with a nominal value of CHF 1.00 and which have the Liquidation Preferences»
- …10/2026"," «valor":"CHF","» → «»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …:"https:// «shares» → «storage»
- …https://shares. «lend» → «googleapis»
- …//shares.lend. «ch» → «com»
- …shares.lend.ch/ «» → «aktionariat/public/40880/100926f2-49f5-4958-ace3-ecaabeef4526/LENDS_TOKEN_Agreement.pdf»
- …,"alcance":" «Visto en la fuente oficial» → «Token Shareholder Agreement (mismo SHA-256»
- …fuente oficial el  «22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad» → «<FECHA>), §2 b: en una venta o liquidación»
- … garantiza disponibilidad,  «elegibilidad ni rentabilidad futura."}» → «si el dinero alcanza»
- … futura."}, «{"etiqueta":"Última operación publicada · 22/10/2026"» → « cada acción C1 cobra 53»
- …/10/2026", «"valor":"68,01» → «72»
- …68,01 CHF  «(07/10/2026)","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://shares.lend.ch/","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa » → «detrás de las preferentes de rango superior »
- (y 71 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2RAH5/AT0000A2RAH5_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2RAH5 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- (y 15 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2T4D7/AT0000A2T4D7_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2T4D7 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- …precio de emisión. «» → « Una sola participación cuesta desde 80 € (81,20 € con el 1,5 %).»
- … <FECHA> ( «16» → «17»
- …FECHA> (16: «54» → «41»
- … (16:54– «16» → «17»
- (y 11 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2U5V3/AT0000A2U5V3_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2U5V3 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- (y 14 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2WCD0/AT0000A2WCD0_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2WCD0 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- (y 14 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2WCE8/AT0000A2WCE8_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2WCE8 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …valor":"Desde  «69» → «71»
- (y 23 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; » → «, pero »
- … EEE; la  «distribución de » → «app no deja comprar »
- …de esta emisión  «en España » → «sin número fiscal austriaco; »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …{"texto":" «» → «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.","tono":"…»
- …AT0000A2YPQ0/AT0000A2YPQ0_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2YPQ0 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- (y 14 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- … API, el  «inquilino se fue » → «alquiler terminó »
- …2026 y se  «busca» → «buscaba»
- … se busca otro «» → « inquilino»
- … busca otro;  «la » → «no consta si ya lo hay. Si sigue vacía, puede no haber repartos. La »
- …:"Para comprar  «esta emisión, quien no tributa en » → «hace falta un número fiscal austriaco: se pide a Hacienda de »
- …tributa en Austria  «debe dar antes un número » → «y, según Brickwise, pedirlo con el asesor »
- …un número fiscal  «austriaco: las » → «que te presenta no cuesta nada. Las »
- …tributan en Austria  «y » → «(»
- …Austria y la  «ganancia al vender paga allí el impuesto inmobiliario (» → «emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la »
- …impuesto inmobiliario (ImmoESt «)» → «»
- …AT0000A2ZT84/AT0000A2ZT84_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A2ZT84 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …(API) ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- (y 19 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace'

- …:"Para comprar  «esta emisión, quien no tributa en » → «hace falta un número fiscal austriaco: se pide a Hacienda de »
- …tributa en Austria  «debe dar antes un número » → «y, según Brickwise, pedirlo con el asesor »
- …un número fiscal  «austriaco: las » → «que te presenta no cuesta nada. Las »
- …tributan en Austria  «y » → «(»
- …Austria y la  «ganancia al vender paga allí el impuesto inmobiliario (» → «emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la »
- …impuesto inmobiliario (ImmoESt «)» → «»
- …AT0000A31KP7/AT0000A31KP7_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A31KP7 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Abrir cuenta no  «confirma que cada» → «basta para esta»
- … que cada emisión « se distribuya en España; exige KYC, test de conveniencia » → «: exige además un número fiscal austriaco (FAQ «Wie sind die Erträge zu versteuern?» »
- … conveniencia y app « propia» → «)»
- …solo en alemán. « Localizador: FAQ «Kann ich einen Account von jedem Land aus eröffnen?».» → «»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- (y 16 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; la distribución de » → « (España incluida); »
- …de esta emisión  «en España » → «no pide número fiscal austriaco, pero »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …"<FECHA>"} «» → «,{"texto":"El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …AT0000A324B4/AT0000A324B4_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A324B4 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- … <FECHA> ( «16» → «17»
- …FECHA> (16: «54» → «41»
- … (16:54– «16» → «17»
- …16:54–16: «56» → «42»
- … <FECHA> ( «16» → «17»
- …FECHA> (16: «54» → «41»
- … (16:54– «16» → «17»
- …16:54–16: «56» → «42»
- … <FECHA> ( «16» → «17»
- (y 5 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; la distribución de » → « (España incluida); »
- …de esta emisión  «en España » → «no pide número fiscal austriaco, pero »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …texto":"Reembolso  «subordinado a los acreedores financieros » → «y repartos subordinados: si el emisor es insolvente, tiene fondos propios negativos, su ratio de recursos propios baja »
- …acreedores financieros del  «emisor» → «8 % o se liquida, solo se cobra después de los acreedores financieros»
- …"<FECHA>"} «» → «,{"texto":"El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …AT0000A38J32/AT0000A38J32_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A38J32 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura. Localizador histórico https://app.brickwise.at/desktopWeb/asset/AT0000A38J32/details (consulta origi…» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …:"https:// «app» → «cdn»
- …app.brickwise.at/ «desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Distribuciones esperadas desde · 22/10/2026","valor":"15/02/2024","fechaDato":null,"fechaConsulta":"2026» → «f6c7c7ff»
- …fechaConsulta":"2026- «10» → «f2f1»
- …:"2026-10- «22","fuente":"https://app» → «4272-86dd-39e02432868c»
- …https://app. «brickwise.at/desktopWeb/marketplace» → «pdf»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- (y 16 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace'

- … residentes del EEE «; la distribución de » → « (España incluida); »
- …de esta emisión  «en España » → «no pide número fiscal austriaco, pero »
- …en España no  «está confirmada » → «consta que se comercialice en España »
- …texto":"Reembolso  «subordinado a los acreedores financieros » → «y repartos subordinados: si el emisor es insolvente, tiene fondos propios negativos, su ratio de recursos propios baja »
- …acreedores financieros del  «emisor» → «8 % o se liquida, solo se cobra después de los acreedores financieros»
- …"<FECHA>"} «» → «,{"texto":"El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no hay retención y la ganancia la declaras tú.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …AT0000A38J40/AT0000A38J40_Ruecktrittsbelehrung.pdf" «» → «,"https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2"»
- …,"fechaConsulta":" «2026-09-30» → «<FECHA>»
- …proveedor comprobado el  «30/09/2026» → «<FECHA> (mercado de la app abierto sin sesión)»
- …abierta o ejecutable. « Localizador histórico https://app.brickwise.at/mobileWeb/asset/AT0000A38J40 (consulta original 2026-09-27); destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.» → «»
- …:"Moneda ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …:"Plazo ·  «22/10/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-10-22» → «<FECHA>»
- …:"https:// «app» → «cdn»
- …app.brickwise.at/ «desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura."},{"etiqueta":"Distribuciones esperadas desde · 22/10/2026","valor":"15/02/2024","fechaDato":null,"fechaConsulta":"2026» → «da8e1df3»
- …fechaConsulta":"2026- «10» → «d334»
- …:"2026-10- «22","fuente":"https://app» → «4075-9311-299f93c8563e»
- …https://app. «brickwise.at/desktopWeb/marketplace» → «pdf»
- …fuente oficial el  «22/10/2026» → «<FECHA>»
- …22/10/2026. « Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura.» → «»
- …Precio · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …inversión · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …adquiere · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Salida · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Riesgos · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Comisiones · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …España · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …comercializa · consulta  «01/11/2026» → «<FECHA>»
- …,"fechaConsulta":" «2026-11-01» → «<FECHA>»
- …Custodia · consulta  «01/11/2026» → «<FECHA>»
- (y 17 cambios más en esta sentencia)

### rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/'

- …Orihuela Costa),  «tiene» → «abrió»
- …tiene la preventa  «abierta desde » → «»
- …18/11 y  «» → «anuncia »
- …y la suscripción  «anunciada » → «»
- …3 · preventa  «abierta » → «»
- … ha revisado.  «El <FECHA>, con» → «Alicante 3 abrió»
- …con la preventa  «ya abierta, Alicante 3 » → «el 18/11/2026 y el <FECHA> »
- …Orihuela Costa),  «tiene» → «abrió»
- …tiene la preventa  «abierta desde » → «»
- …18/11 y  «» → «anuncia »
- …y la suscripción  «anunciada » → «»
- …{"etiqueta":" «Destino de consulta comprobado","valor":"Plataforma inmobiliaria Hausera","fechaDato":null,"fechaConsulta":"2026-09-30","fuente":"https://hausera.io/","alcance":"Destino público del proveedor comprobado el 30/09/2026. No renueva cifras económicas ni acredita una oferta abierta o ejecutable. Localiza…» → «»
- … en Alicante 3 «, según su » → « (»
- … documento de emisión « (<FECHA>» → «»
- …<FECHA>);  «preventa abierta » → «reserva »
- … el 18/11 «» → « y suscripción del 25/11/2026 al 30/06/2027»
- …,"alcance":" «Comprobado de nuevo » → «Redacción en castellano del dato comprobado »
- … (5.11) «. El <FECHA> la preventa estaba abierta (desde el 18» → «; periodo de suscripción del 25»
- … 18/11/2026 «» → « al 30/6/2027 (5.9»
- …18/11/2026) « y la suscripción empieza» → «. La preventa (reserva) abrió»
- …suscripción empieza el  «25» → «18»
- … 25/11/2026 «» → « según la ficha»

## Lo que no se aplicó tal cual (15)

- spiko-letras-del-tesoro-euro: DECISIONES §2 (corrección del revisor de Spiko): «Acceso desde España» → «Disponible para residentes en España tras el alta y la verificación de identidad; la SICAV está inscrita en la CNMV»
- spiko-letras-del-tesoro-dolar: DECISIONES §2 (corrección del revisor de Spiko): «Acceso desde España» → «Disponible para residentes en España tras el alta y la verificación de identidad; la SICAV está inscrita en la CNMV»
- spiko-letras-del-tesoro-euro: Auditoría Spiko §2: quitar también las dos «Gestión publicada: 0,25 %» del 30/09/2026
- spiko-letras-del-tesoro-euro: Auditoría Spiko §2: dar otro nombre a «Salida · consulta 01/11/2026» y «Acceso desde España (particulares) · consulta 01/11/2026» (p. ej. «Órdenes de reembolso (KID)»)
- spiko-letras-del-tesoro-dolar: Auditoría Spiko §3: cambiar «Patrimonio y partícipes · consulta 01/11/2026» por «Patrimonio y titulares: 176,97 millones de dólares · 904 titulares»
- mtbill: Revisión acciones-oro-tesoro, corrección 3: añadir la huella del vigía a `avisosConFecha` 0, 1 y 6 del expediente de mTBILL
- aktionariat: Expediente y DECISIONES §2: quitar las dos «Último cruce publicado: 6,25 CHF» (22/09/2026, consulta del 30/09/2026)
- aktionariat: DECISIONES §2: la referencia nueva «Salida · 21/11/2026: mejor compra 5,01 ZCHF (5 acciones); 78 pedidas»
- hausera-proximas-ofertas: Expediente: cambiar la etiqueta «Historial publicado · 20/11/2026» por «Historial que publica Hausera (consultado el 21/11/2026)»
- fotovoltaica-cohotel, randhartingergasse-9-viena y apartamento-vacacional-hinterstoder-50: Revisión brickwise-b C1 y auditoría brickwise-b obligatorio 1: mínimo «1 participación desde 120 € / 85 € / 82 € en reventa (21/11)»
- brickwise (11 fichas): Expedientes de brickwise-b y recomendada de brickwise-a: cambiar el nombre de «Precio · consulta 01/11/2026» y «Mínimo de inversión · consulta 01/11/2026» por «Precio de emisión original» y «Mínimo de la suscripción original (cerrada)»
- brickwise (11 fichas): Expedientes de Brickwise: fuentes de la oferta nuevas (API v1 y v2 y ayuda de impuestos) y fuera las páginas www.brickwise.at/assets/…
- vivienda-pottendorfer-stra-e-62-wr-neustadt, fotovoltaica-greenpoint y fotovoltaica-cohotel: Expedientes y recomendada R1 del revisor y la auditoría de brickwise-b: «Acceso desde España» → «Sin confirmar: cuenta para residentes del EEE, no pide número fiscal austriaco; no consta su venta en España.»
- hausera-proximas-ofertas: DECISIONES §2 (textos largos): «Acceso desde España» como lo propone el expediente («Particulares en España que pasen el alta y el test del emisor: reserva desde el 18/11 y suscripción desde el 25/11/2026.»)
- midas: DECISIONES §7 (4): en el radar, añadir como fuente del acceso las «Condiciones Finales de mTBILL (17/07/2026)» y como fuente de la licencia «CNMV · Pasaportes recibidos (Midas Software GmbH)»
