# Qué cambia en la entrega 2026-11-26 (frente a la 2026-11-21)

Generado por el motor (`motor.mjs revisar 2026-11-26`) a partir de decisiones.json, el contraste y los dos SQL. Es el punto de partida de la revisión: cada revisor sigue haciendo sus propias pruebas.

- SQL de hoy: `aplicar-y-aprobar.sql` SHA-256 `9b75ebf164c08e1cc1df6c29c79d515b8bfe960cff92781ac3fe644ccf527125`, revisión `47b53d7d-e223-b1fb-dc78-f06745466eef`.
- Parte de la publicada `fe0cfaa8-9682-b729-69e2-9bb4f8587ce9` (huella `fe0cfaa89682b729…`); último día vigente 03/12/2026.
- Inventario: las mismas filas por tabla que ayer (35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias del SQL que cambian algo más que la revisión, la huella y la fecha del día: **23** de 288.

## Cambios por ficha (300 en 22 fichas)

### spiko-letras-del-tesoro-euro

- rentabilidad: «2,45 % · Rendimiento neto anualizado de los últimos 31 días que publica Spiko con el valor liquidativo calculado el viernes 20/11/2026; consultado el 21/11/2026. Variable y no garantizado.» → «2,44 % · Rendimiento neto anualizado de los últimos 31 días que publica Spiko con el valor liquidativo del 26/11/2026 (1,063785 €); consultado el 26/11/2026. Variable y no garantizado.»
- métrica: «Rentabilidad publicada · 31 días · 20/11/2026: 2,45 %» → «Rentabilidad publicada · 31 días · 26/11/2026: 2,44 %»
- referencia de la ficha: «Rentabilidad publicada · 31 días: 2,45 %» → «Rentabilidad publicada · 31 días: 2,44 %»
- referencia de la ficha: «Estado de la oferta · consulta 21/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs» → «Estado de la oferta · consulta 26/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs»
- referencia de la ficha: «Comisión de gestión · 21/11/2026: 0,25 %» → «Comisión de gestión · 26/11/2026: 0,25 %»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año. Este porcentaje se basa en los costes reales del último año.» → «Comisiones · consulta 26/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año. Este porcentaje se basa en los costes reales del último año.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Depositario: CACEIS Bank ... los activos del Producto conservados por el depositario no se verán afectados» → «Custodia · consulta 26/11/2026: Depositario: CACEIS Bank ... los activos del Producto conservados por el depositario no se verán afectados»
- referencia de la ficha: «Salida · consulta 21/11/2026: Las solicitudes ... son centralizadas por Spiko Finance a más tardar a las 11:30 (hora de París). Estas solicitudes se ejecutan sobre la base del último valor liquidativo conocido.» → «Salida · consulta 26/11/2026: Las solicitudes ... son centralizadas por Spiko Finance a más tardar a las 11:30 (hora de París). Estas solicitudes se ejecutan sobre la base del último valor liquidativo conocido.»
- referencia de la ficha: «Reembolso inmediato · consulta 21/11/2026: Instant transfers are supported for amounts up to €500,000 per day» → «Reembolso inmediato · consulta 26/11/2026: Instant transfers are supported for amounts up to €500,000 per day»
- referencia de la ficha: «Acceso desde España (particulares) · consulta 21/11/2026: Customer: a Customer may be a natural person with full legal capacity ... (i) a consumer» → «Acceso desde España (particulares) · consulta 26/11/2026: Customer: a Customer may be a natural person with full legal capacity ... (i) a consumer»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7 ... El capital no está garantizado» → «Riesgos · consulta 26/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7 ... El capital no está garantizado»

### spiko-letras-del-tesoro-dolar

- rentabilidad: «4,00 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 20/11/2026 (VL del 20/11/2026); consultado el 21/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.» → «3,90 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 25/11/2026 (VL del 25/11/2026); consultado el 26/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.»
- métrica: «Rentabilidad publicada · 31 días · 20/11/2026 · en USD: 4,00 %» → «Rentabilidad publicada · 31 días · 25/11/2026 · en USD: 3,90 %»
- referencia de la ficha: «Rentabilidad publicada · 31 días: 4,00 %» → «Rentabilidad publicada · 31 días: 3,90 %»
- referencia de la ficha: «Estado de la oferta · consulta 21/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs» → «Estado de la oferta · consulta 26/11/2026: Statut : Vivant · Type de souscripteurs : Tous souscripteurs»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año» → «Comisiones · consulta 26/11/2026: Gastos de gestión y otros gastos administrativos u operativos: 0,25 % del valor de su inversión al año»
- referencia de la ficha: «Moneda y tipo de cambio · consulta 21/11/2026: Atención al riesgo de cambio ... la ganancia final dependerá del tipo de cambio entre ambas monedas. Este riesgo no se tiene en cuenta en el indicador anterior.» → «Moneda y tipo de cambio · consulta 26/11/2026: Atención al riesgo de cambio ... la ganancia final dependerá del tipo de cambio entre ambas monedas. Este riesgo no se tiene en cuenta en el indicador anterior.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Depositario: CACEIS Bank» → «Custodia · consulta 26/11/2026: Depositario: CACEIS Bank»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7» → «Riesgos · consulta 26/11/2026: Hemos clasificado este Producto en el indicador de riesgo 1 sobre 7»
- referencia de la ficha: «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026) · IIC comunitaria (Francia)» → «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026) · IIC comunitaria (Francia)»

### spiko-smart-cash-euro

- rentabilidad: «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 20/11/2026 (consultado el 21/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.» → «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 26/11/2026 (consultado el 26/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.»
- métrica: «Rentabilidad publicada · neta y variable · 20/11/2026: 2,84 %» → «Rentabilidad publicada · neta y variable · 26/11/2026: 2,84 %»
- referencia de la ficha: «Rendimiento neto publicado: 2,84 %» → «Rendimiento neto publicado: 2,84 %»
- referencia de la ficha: «Comisión de gestión: 0,25 % anual; gastos de funcionamiento de hasta el 0,10 %; sin comisión de entrada ni de salida» → «Comisión de gestión: 0,25 % anual; gastos de funcionamiento de hasta el 0,10 %; sin comisión de entrada ni de salida»
- referencia de la ficha: «Riesgo (KID): 1 de 7, sin contar el riesgo de contraparte; capital no garantizado y sin rentabilidad mínima; en los escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses (moderado: 9.990 €); plazo recomendado de 3 meses» → «Riesgo (KID): 1 de 7, sin contar el riesgo de contraparte; capital no garantizado y sin rentabilidad mínima; en los escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses (moderado: 9.990 €); plazo recomendado de 3 meses»
- referencia de la ficha: «Ajuste del valor liquidativo: Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)» → «Ajuste del valor liquidativo: Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)»
- referencia de la ficha: «Aprobación del compartimento: N.º SCV20260075, en la lista de compartimentos del certificado de la AMF del 23/02/2026» → «Aprobación del compartimento: N.º SCV20260075, en la lista de compartimentos del certificado de la AMF del 23/02/2026»
- referencia de la ficha: «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026)» → «Registro de la SICAV en España: Spiko SICAV · CNMV n.º 2380 (30/01/2026)»
- referencia de la ficha: «Web frente al KID: La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»» → «Web frente al KID: La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»»

### robinhood-classic-stock-tokens

- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Classic Stock Tokens are derivative contracts between you and Robinhood. They are priced at the prices of the underlying securities without granting rights to them.» → «Qué se adquiere · consulta 26/11/2026: Classic Stock Tokens are derivative contracts between you and Robinhood. They are priced at the prices of the underlying securities without granting rights to them.»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Your rights under the Product come from your contract with Robinhood Europe, and are also represented by a blockchain-traded token (the 'Token'), issued to you at the time of entering into the contract.» → «Qué se adquiere · consulta 26/11/2026: Your rights under the Product come from your contract with Robinhood Europe, and are also represented by a blockchain-traded token (the 'Token'), issued to you at the time of entering into the contract.»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Robinhood Europe applies a 0.10% currency conversion fee for each transaction ... Robinhood Europe does not apply any other fees related to the trading of Classic Stock Tokens.» → «Comisiones · consulta 26/11/2026: Robinhood Europe applies a 0.10% currency conversion fee for each transaction ... Robinhood Europe does not apply any other fees related to the trading of Classic Stock Tokens.»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: We have classified this Product as 7 out of 7, which is the highest risk class.» → «Riesgos · consulta 26/11/2026: We have classified this Product as 7 out of 7, which is the highest risk class.»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: The product is not covered by an investor compensation or deposit insurance scheme. Robinhood Europe is the sole counterparty to payment claims arising from the Product» → «Riesgos · consulta 26/11/2026: The product is not covered by an investor compensation or deposit insurance scheme. Robinhood Europe is the sole counterparty to payment claims arising from the Product»
- referencia de la ficha: «Precio · consulta 21/11/2026: Explore 2,000+ Classic Stock Tokens linked to US stocks and ETPs» → «Precio · consulta 26/11/2026: Explore 2,000+ Classic Stock Tokens linked to US stocks and ETPs»
- referencia de la ficha: «Custodia · consulta 21/11/2026: although Robinhood hedges its obligations by purchasing US shares or ETPs for its own account on a 1:1 basis with the US Share Derivatives it issues» → «Custodia · consulta 26/11/2026: although Robinhood hedges its obligations by purchasing US shares or ETPs for its own account on a 1:1 basis with the US Share Derivatives it issues»

### mtbill

- métrica: «Valor por token · 20/11/2026: 1,0789 USD (oráculo del emisor)» → «Valor por token · 24/11/2026: 1,0791 USD (oráculo del emisor)»
- métrica: «Rentabilidad pasada · 5 semanas hasta el 20/11/2026 · en USD: 3,46 % anual» → «Rentabilidad pasada · 5 semanas hasta el 24/11/2026 · en USD: 3,42 % anual»
- aviso: «La rentabilidad es pasada y la calcula RWAdar con el valor que publica el emisor (del 16/10 al 20/11/2026): está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la futura.» → «La rentabilidad es pasada y la calcula RWAdar con el valor que publica el emisor (del 20/10 al 24/11/2026): está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la futura.»
- referencia de la ficha: «Países de oferta pública · Condiciones Finales del 17/07/2026: Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany» → «Países de oferta pública · Condiciones Finales del 17/07/2026: Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany»

### prosegur-digital-gold

- referencia de la ficha: «Costes publicados de compra y venta: Compra: LBMA +4%; venta: LBMA −6%» → «Costes publicados de compra y venta: Compra: LBMA +4%; venta: LBMA −6%»
- referencia de la ficha: «Salida y plazo contractual publicados: Solo recompra por Prosegur; procesamiento normal aproximado de 1 a 7 días hábiles» → «Salida y plazo contractual publicados: Solo recompra por Prosegur; procesamiento normal aproximado de 1 a 7 días hábiles»
- referencia de la ficha: «Estado de la oferta · consulta 21/11/2026: Precio de compra 107,88 € · Emitida · Comprar (app); «Empieza hoy mismo» (web)» → «Estado de la oferta · consulta 26/11/2026: Precio de compra 107,88 € · Emitida · Comprar (app); «Empieza hoy mismo» (web)»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Los Tokens de Oro confieren derechos sobre una cantidad equivalente de oro físico segregado mantenido dentro de un inventario fungible» → «Qué se adquiere · consulta 26/11/2026: Los Tokens de Oro confieren derechos sobre una cantidad equivalente de oro físico segregado mantenido dentro de un inventario fungible»
- referencia de la ficha: «Supervisión · consulta 21/11/2026: SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO» → «Supervisión · consulta 26/11/2026: SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Compra de tokens ... Precio LBMA diario + 4% · Venta de tokens ... Precio LBMA diario - 6%» → «Comisiones · consulta 26/11/2026: Compra de tokens ... Precio LBMA diario + 4% · Venta de tokens ... Precio LBMA diario - 6%»
- referencia de la ficha: «Custodia · consulta 21/11/2026: El Oro Físico ... será almacenado en instalaciones de custodia de alta seguridad de Prosegur Crypto (o en las de terceros custodios especialmente designados)» → «Custodia · consulta 26/11/2026: El Oro Físico ... será almacenado en instalaciones de custodia de alta seguridad de Prosegur Crypto (o en las de terceros custodios especialmente designados)»
- referencia de la ficha: «Rentabilidad · consulta 21/11/2026: PROSEGUR CRYPTO NO GARANTIZA NI RENTABILIDAD NI UN VALOR FIJO DE LOS TOKENS DE ORO» → «Rentabilidad · consulta 26/11/2026: PROSEGUR CRYPTO NO GARANTIZA NI RENTABILIDAD NI UN VALOR FIJO DE LOS TOKENS DE ORO»
- referencia de la ficha: «Fiscalidad · consulta 21/11/2026: Los Tokens de Oro suponen una entrega de oro de inversión exenta de IVA de acuerdo con lo dispuesto en el artículo 140. Bis de la Ley de IVA» → «Fiscalidad · consulta 26/11/2026: Los Tokens de Oro suponen una entrega de oro de inversión exenta de IVA de acuerdo con lo dispuesto en el artículo 140. Bis de la Ley de IVA»

### aktionariat

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (26/11/2026)»
- métrica: «Precio del emisor · 21/11/2026: 7,25 CHF por acción (fijo)» → «Precio del emisor · 26/11/2026: 7,25 CHF por acción (fijo)»
- aviso: «Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el 21/11/2026 la venta más barata era de 6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF.» → «Entre accionistas se vende por debajo del precio del emisor (7,25 CHF): el 26/11/2026 la venta más barata era de 6,20 ZCHF; la última venta, del 21/11/2026, fue de 62 acciones a 5,00 ZCHF.»
- referencia de la ficha: «Última operación entre accionistas · 21/11/2026: 5,00 ZCHF (62 acciones, 21/11/2026)» → «Última operación entre accionistas · 26/11/2026: 5,00 ZCHF (62 acciones, 21/11/2026)»
- referencia de la ficha: «Número de accionistas publicado · 21/11/2026: 368» → «Número de accionistas publicado · 26/11/2026: 368»
- referencia de la ficha: «Acciones tokenizadas · 21/11/2026: 800.000 DAKS de 1.800.000» → «Acciones tokenizadas · 26/11/2026: 800.000 DAKS de 1.800.000»
- referencia de la ficha: «Salida · consulta 21/11/2026: As communicated to our shareholders, the sell-side of the Brokerbot will remain disabled for the foreseeable future. Feel free to post your sell offer on our secondaries widget below.» → «Salida · consulta 26/11/2026: As communicated to our shareholders, the sell-side of the Brokerbot will remain disabled for the foreseeable future. Feel free to post your sell offer on our secondaries widget below.»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None» → «Qué se adquiere · consulta 26/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None»
- referencia de la ficha: «Supervisión · consulta 21/11/2026: The secondary trading facilitated herein is considered a non-commercial trading facility … not subject to prudential supervision.» → «Supervisión · consulta 26/11/2026: The secondary trading facilitated herein is considered a non-commercial trading facility … not subject to prudential supervision.»
- referencia de la ficha: «Folleto · consulta 21/11/2026: Such offers constitute a primary offering by the issuer and are governed by the Financial Services Act in Switzerland … Once certain thresholds are reached, it is the responsibility of the issuer to publish a prospectus» → «Folleto · consulta 26/11/2026: Such offers constitute a primary offering by the issuer and are governed by the Financial Services Act in Switzerland … Once certain thresholds are reached, it is the responsibility of the issuer to publish a prospectus»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: An investment in a company is suitable only for investors who … can afford a loss of all or part of their investment.» → «Riesgos · consulta 26/11/2026: An investment in a company is suitable only for investors who … can afford a loss of all or part of their investment.»
- referencia de la ficha: «Última compra al emisor · 21/11/2026: 7,25 ZCHF (1 acción, 31/10/2026)» → «Última compra al emisor · 26/11/2026: 7,25 ZCHF (1 acción, 31/10/2026)»
- referencia de la ficha: «Libro entre accionistas · 21/11/2026: Mejor compra entre accionistas 5,01 ZCHF (5 acciones); 78 acciones pedidas en total» → «Libro entre accionistas · 26/11/2026: Mejor compra entre accionistas 5,01 ZCHF (5 acciones); 78 acciones pedidas en total»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Entre accionistas: 0 % para quien compra y 1,9 % para quien vende» → «Comisiones · consulta 26/11/2026: Entre accionistas: 0 % para quien compra y 1,9 % para quien vende»

### kraken-xstocks

- referencia de la ficha: «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado» → «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado»
- referencia de la ficha: «Registro del vendedor: Payward Europe Digital Solutions (CY) Limited · ESI del EEE en libre prestación · n.º 4474» → «Registro del vendedor: Payward Europe Digital Solutions (CY) Limited · ESI del EEE en libre prestación · n.º 4474»
- referencia de la ficha: «Licencia del vendedor: CySEC, licencia 342/17» → «Licencia del vendedor: CySEC, licencia 342/17»
- referencia de la ficha: «Comisión con euros: 1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica» → «Comisión con euros: 1 % por compra instantánea, o hasta 2 USD en compras pequeñas según la versión inglesa de la tabla, más un diferencial que Kraken no publica»
- referencia de la ficha: «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 %» → «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 %»
- referencia de la ficha: «Situación del emisor: No es rentable, depende de la financiación de su grupo y avala un préstamo de su matriz» → «Situación del emisor: No es rentable, depende de la financiación de su grupo y avala un préstamo de su matriz»

### boss-info

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (26/11/2026)»
- aviso: «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 21/11/2026).» → «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 26/11/2026).»
- tarjeta: «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 21/11)» → «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 26/11)»
- referencia de la ficha: «Número de accionistas publicado · 21/11/2026: 155» → «Número de accionistas publicado · 26/11/2026: 155»
- referencia de la ficha: «Acciones tokenizadas · 21/11/2026: 10.650.100 BOSS» → «Acciones tokenizadas · 26/11/2026: 10.650.100 BOSS»
- referencia de la ficha: «Salida · consulta 21/11/2026: Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert.» → «Salida · consulta 26/11/2026: Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert.»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None» → «Qué se adquiere · consulta 26/11/2026: Issued instrument Registered shares (Namenaktien) … Transfer restrictions (Vinkulierung) None»
- referencia de la ficha: «Supervisión · consulta 21/11/2026: not subject to prudential supervision» → «Supervisión · consulta 26/11/2026: not subject to prudential supervision»
- referencia de la ficha: «Salida · 21/11/2026: Bid/Ask 7.30 / 8.40 · Spread 13.10%» → «Salida · 26/11/2026: Bid/Ask 7.30 / 8.40 · Spread 13.10%»
- referencia de la ficha: «Última operación · 21/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)» → «Última operación · 26/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)»

### switzerlend

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (21/11/2026); afiliada a PolyReg solo a efectos de blanqueo» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (26/11/2026); afiliada a PolyReg solo a efectos de blanqueo»
- aviso: «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 21/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).» → «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 26/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).»
- aviso: «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 21/11/2026).» → «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 26/11/2026).»
- tarjeta: «Mínimo de inversión: 1 acción (68,01 CHF el 21/11, precio del emisor)» → «Mínimo de inversión: 1 acción (68,01 CHF el 26/11, precio del emisor)»
- referencia de la ficha: «Salida · 21/11/2026: Bid/Ask 59.00 / 67.00 · Spread 11.94%» → «Salida · 26/11/2026: Sin órdenes de compra entre accionistas; la venta más barata pide 67,00 ZCHF»
- referencia de la ficha: «Número de accionistas publicado · 21/11/2026: 286» → «Número de accionistas publicado · 26/11/2026: 286»
- referencia de la ficha: «Acciones tokenizadas · 21/11/2026: 27.277 LENDS de 31.066» → «Acciones tokenizadas · 26/11/2026: 27.277 LENDS de 31.066»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: All Share Tokens are issued as preferred C1 shares with a nominal value of CHF 1.00 and which have the Liquidation Preferences» → «Qué se adquiere · consulta 26/11/2026: All Share Tokens are issued as preferred C1 shares with a nominal value of CHF 1.00 and which have the Liquidation Preferences»
- referencia de la ficha: «Última compra al emisor · 21/11/2026: 68,01 ZCHF (10 + 1 acciones, 07/10/2026)» → «Última compra al emisor · 26/11/2026: 68,01 ZCHF (10 + 1 acciones, 07/10/2026)»
- referencia de la ficha: «Última operación entre accionistas · 21/11/2026: 67,00 ZCHF (1 acción, 25/08/2026)» → «Última operación entre accionistas · 26/11/2026: 67,00 ZCHF (1 acción, 25/08/2026)»

### vivienda-pluddemanngasse-101-graz

- referencia de la ficha: «Venta más barata · 21/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)» → «Venta más barata · 26/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 335» → «Participaciones en venta · 26/11/2026: 335»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 20,00 € (1 participación, orden del 23/04/2026)» → «Mejor oferta de compra · 26/11/2026: 20,00 € (1 participación, orden del 23/04/2026)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 103,37» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 103,37»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 103,37» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 103,37»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### vivienda-sonnleithnergasse-2-viena

- referencia de la ficha: «Venta más barata · 21/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)» → «Venta más barata · 26/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 80,00 € (81,20 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 100,00 € (101,50 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 97» → «Participaciones en venta · 26/11/2026: 96»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 65,00 € (2 participaciones en 2 órdenes; la más antigua del 16/10/2026)» → «Mejor oferta de compra · 26/11/2026: 65,00 € (2 participaciones en 2 órdenes; la más antigua del 16/10/2026)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 101,37» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 101,37»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 101,37» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 101,37»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### local-de-estanco-klagenfurt

- referencia de la ficha: «Venta más barata · 21/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)» → «Venta más barata · 26/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 299» → «Participaciones en venta · 26/11/2026: 299»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 15,00 € (1 participación, orden del 21/09/2026)» → «Mejor oferta de compra · 26/11/2026: 15,00 € (1 participación, orden del 21/09/2026)»
- tarjeta: «Mínimo de inversión: Desde 95 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 95 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,02» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,02»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,02» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,02»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### vivienda-stallhofstra-e-28-gratwein

- referencia de la ficha: «Venta más barata · 21/11/2026: 68,80 € por participación (1 a ese precio, orden del 08/11/2026)» → «Venta más barata · 26/11/2026: 70,00 € por participación (18 a ese precio, en 6 órdenes de 6, 5, 1, 2, 2, 2)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 68,80 € (69,83 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 315» → «Participaciones en venta · 26/11/2026: 312»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 30,00 € (1 participación, orden del 01/07/2026)» → «Mejor oferta de compra · 26/11/2026: 30,00 € (1 participación, orden del 01/07/2026)»
- tarjeta: «Mínimo de inversión: Desde 68,80 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 70 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,10» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,10»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,10» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,10»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### vivienda-schwarzer-weg-18-graz

- referencia de la ficha: «Venta más barata · 21/11/2026: 71,00 € por participación (1 a ese precio, orden del 21/11/2026)» → «Venta más barata · 26/11/2026: 71,00 € por participación (1 a ese precio, orden del 21/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 71,00 € (72,07 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 71,00 € (72,07 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 298» → «Participaciones en venta · 26/11/2026: 298»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 62,00 € (1 participación, orden del 17/11/2026)» → «Mejor oferta de compra · 26/11/2026: 62,00 € (1 participación, orden del 17/11/2026)»
- tarjeta: «Mínimo de inversión: Desde 71,00 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 71 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,14» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,14»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,14» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,14»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### drautalresidenz-paternion

- referencia de la ficha: «Venta más barata · 21/11/2026: 70,00 € por participación (1 a ese precio, orden del 17/11/2026)» → «Venta más barata · 26/11/2026: 70,00 € por participación (1 a ese precio, orden del 17/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 147» → «Participaciones en venta · 26/11/2026: 147»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 50,00 € (1 participación, orden del 29/09/2026)» → «Mejor oferta de compra · 26/11/2026: 50,00 € (1 participación, orden del 29/09/2026)»
- tarjeta: «Mínimo de inversión: Desde 70 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 70 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,05» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,05»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,05» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,05»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar esta emisión (producto de capital de un emisor austriaco); también hace falta para pagar en Austria la ImmoESt si vendes con ganancia.»

### randhartingergasse-9-viena

- referencia de la ficha: «Venta más barata · 21/11/2026: 78,00 € por participación (20 a ese precio, orden del 29/06/2026)» → «Venta más barata · 26/11/2026: 78,00 € por participación (20 a ese precio, orden del 29/06/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 85,00 € (86,28 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 85,00 € (86,28 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 188» → «Participaciones en venta · 26/11/2026: 188»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 64,00 € (1 participación, orden del 12/11/2026)» → «Mejor oferta de compra · 26/11/2026: 65,00 € (1 participación, orden del 23/11/2026)»
- tarjeta: «Mínimo de inversión: Desde 78 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 78 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Precio de emisión por participación (API) · 21/11/2026: 100,24 EUR» → «Precio de emisión por participación (API) · 26/11/2026: 100,24 EUR»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,24» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,24»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,24» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,24»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión»

### apartamento-vacacional-hinterstoder-50

- referencia de la ficha: «Venta más barata · 21/11/2026: 75,00 € por participación (5 a ese precio, orden del 08/11/2026)» → «Venta más barata · 26/11/2026: 77,00 € por participación (5 a ese precio, orden del 03/10/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 82,00 € (83,23 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 82,00 € (83,23 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 252» → «Participaciones en venta · 26/11/2026: 247»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)» → «Mejor oferta de compra · 26/11/2026: 75,00 € (1 participación, orden del 24/11/2026)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 77 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: indefinido» → «Plazo · 26/11/2026: indefinido»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,20» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,20»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,20» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,20»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 26/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)» → «Salida · consulta 26/11/2026: Ordentliche Kündigung: Nein (siehe zu den Ausnahmen Punkt 11)»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión» → «Número fiscal austriaco · 26/11/2026: Obligatorio para comprar: sin él la app no deja comprar esta emisión»

### vivienda-pottendorfer-stra-e-62-wr-neustadt

- referencia de la ficha: «Venta más barata · 21/11/2026: 81,00 € por participación (1 a ese precio, orden del 15/11/2026)» → «Venta más barata · 26/11/2026: 81,00 € por participación (1 a ese precio, orden del 15/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 81,00 € (82,22 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 81,00 € (82,22 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 96» → «Participaciones en venta · 26/11/2026: 96»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 64,00 € (1 participación, orden del 17/11/2026)» → «Mejor oferta de compra · 26/11/2026: 64,00 € (1 participación, orden del 17/11/2026)»
- tarjeta: «Mínimo de inversión: Desde 81 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 81 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,44» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,44»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,44» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,44»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Genussschein ... läuft grundsätzlich endlos/ewig ("Perpetual")» → «Qué se adquiere · consulta 26/11/2026: Genussschein ... läuft grundsätzlich endlos/ewig ("Perpetual")»
- referencia de la ficha: «Salida · consulta 21/11/2026: die ordentliche Kündigung ist erstmals nach 15 (fünfzehn) Jahren ab dem Ausgabetag und sodann alle ...» → «Salida · consulta 26/11/2026: die ordentliche Kündigung ist erstmals nach 15 (fünfzehn) Jahren ab dem Ausgabetag und sodann alle ...»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)» → «Número fiscal austriaco · 26/11/2026: No hace falta (producto con retención austriaca KESt)»

### fotovoltaica-greenpoint

- referencia de la ficha: «Venta más barata · 21/11/2026: 102,00 € por participación (8 a ese precio, en 3 órdenes de 5, 2, 1)» → «Venta más barata · 26/11/2026: 102,00 € por participación (6 a ese precio, en 2 órdenes de 5, 1)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 347» → «Participaciones en venta · 26/11/2026: 345»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 29,00 € (1 participación, orden del 10/08/2024)» → «Mejor oferta de compra · 26/11/2026: 29,00 € (1 participación, orden del 10/08/2024)»
- tarjeta: «Mínimo de inversión: Desde 102 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 102 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: hasta el 31/12/2038» → «Plazo · 26/11/2026: hasta el 31/12/2038»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,32» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,32»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,32» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,32»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.» → «Qué se adquiere · consulta 26/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Laufzeit von 15 Jahren ("endfällig")» → «Salida · consulta 26/11/2026: Laufzeit von 15 Jahren ("endfällig")»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)» → «Número fiscal austriaco · 26/11/2026: No hace falta (producto con retención austriaca KESt)»

### fotovoltaica-cohotel

- referencia de la ficha: «Venta más barata · 21/11/2026: 110,00 € por participación (35 a ese precio, en 2 órdenes de 31, 4)» → «Venta más barata · 26/11/2026: 110,00 € por participación (35 a ese precio, en 2 órdenes de 31, 4)»
- referencia de la ficha: «Orden de venta de menor importe · 21/11/2026: 1 participación a 120,00 € (121,80 € con el 1,5 %)» → «Orden de venta de menor importe · 26/11/2026: 1 participación a 120,00 € (121,80 € con el 1,5 %)»
- referencia de la ficha: «Participaciones en venta · 21/11/2026: 59» → «Participaciones en venta · 26/11/2026: 59»
- referencia de la ficha: «Mejor oferta de compra · 21/11/2026: 3,00 € (1 participación, orden del 23/11/2024)» → «Mejor oferta de compra · 26/11/2026: 3,00 € (1 participación, orden del 23/11/2024)»
- tarjeta: «Mínimo de inversión: Desde 110 € la participación en reventa (21/11)» → «Mínimo de inversión: Desde 110 € la participación en reventa (26/11)»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- referencia de la ficha: «Moneda · 21/11/2026: EUR» → «Moneda · 26/11/2026: EUR»
- referencia de la ficha: «Plazo · 21/11/2026: hasta el 31/12/2038» → «Plazo · 26/11/2026: hasta el 31/12/2038»
- referencia de la ficha: «Precio · consulta 21/11/2026: Ausgabepreis: EUR 100,85» → «Precio · consulta 26/11/2026: Ausgabepreis: EUR 100,85»
- referencia de la ficha: «Mínimo de inversión · consulta 21/11/2026: Mindestzeichnungsbetrag: EUR 100,85» → «Mínimo de inversión · consulta 26/11/2026: Mindestzeichnungsbetrag: EUR 100,85»
- referencia de la ficha: «Qué se adquiere · consulta 21/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.» → «Qué se adquiere · consulta 26/11/2026: Jeder Token vermittelt dem Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum Endfälligkeitstag.»
- referencia de la ficha: «Salida · consulta 21/11/2026: Laufzeit von 15 Jahren ("endfällig")» → «Salida · consulta 26/11/2026: Laufzeit von 15 Jahren ("endfällig")»
- referencia de la ficha: «Riesgos · consulta 21/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft» → «Riesgos · consulta 26/11/2026: Wir haben dieses Produkt auf einer Skala von 1 bis 7 in die Risikoklasse 6 eingestuft»
- referencia de la ficha: «Comisiones · consulta 21/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt» → «Comisiones · consulta 26/11/2026: Vermittlungsgebühr 1,50% ... wird jedem/jeder Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung gestellt»
- referencia de la ficha: «Acceso desde España · consulta 21/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» → «Acceso desde España · consulta 26/11/2026: Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- referencia de la ficha: «Entidad que comercializa · consulta 21/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.» → «Entidad que comercializa · consulta 26/11/2026: Die Brickwise Investment GmbH ist vertraglich gebundener Vermittler im Sinne von § 3 (2) WpIG und wird ... ausschließlich für Rechnung und unter Haftung der Effecta GmbH, Florstadt, tätig.»
- referencia de la ficha: «Custodia · consulta 21/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 26/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.»
- referencia de la ficha: «Desistimiento: No hay derecho de desistimiento al comprar en reventa» → «Desistimiento: No hay derecho de desistimiento al comprar en reventa»
- referencia de la ficha: «Número fiscal austriaco · 21/11/2026: No hace falta (producto con retención austriaca KESt)» → «Número fiscal austriaco · 26/11/2026: No hace falta (producto con retención austriaca KESt)»

### hausera-proximas-ofertas

- resumen: «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 2 ya está financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), abrió la preventa el 18/11 y anuncia la suscripción del 25/11/2026 al 30/06/2027.» → «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 3, la última, ya figura como financiada (26/11/2026) y Hausera no anuncia otra operación.»
- métrica: «Próxima operación: Alicante 3 · preventa desde el 18/11/2026; suscripción del 25/11/2026 al 30/06/2027» → «Próxima operación: Ninguna anunciada: Alicante 3 figura como financiada el 26/11/2026»
- aviso: «El documento de emisión no es un folleto y la CNMV no lo ha revisado. Alicante 3 abrió la preventa el 18/11/2026 y el 21/11/2026 aún no estaba inscrita en el registro de la CNMV.» → «El documento de emisión no es un folleto y la CNMV no lo ha revisado. Alicante 3 ya está financiada: no queda importe por suscribir.»
- tarjeta: «Mínimo de inversión: Desde 100 € en Alicante 3 (documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.» → «Mínimo de inversión: Sin operación abierta: Alicante 3 ya está financiada (26/11)»

## Tarjetas que cambian (14)

- boss-info: Mínimo de inversión: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 21/11)» → «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 26/11)»
- switzerlend: Mínimo de inversión: «1 acción (68,01 CHF el 21/11, precio del emisor)» → «1 acción (68,01 CHF el 26/11, precio del emisor)»
- hausera-proximas-ofertas: Mínimo de inversión: «Desde 100 € en Alicante 3 (documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.» → «Sin operación abierta: Alicante 3 ya está financiada (26/11)»
- vivienda-pluddemanngasse-101-graz: Mínimo de inversión: «Desde 75 € la participación en reventa (21/11)» → «Desde 75 € la participación en reventa (26/11)»
- vivienda-sonnleithnergasse-2-viena: Mínimo de inversión: «Desde 75 € la participación en reventa (21/11)» → «Desde 75 € la participación en reventa (26/11)»
- local-de-estanco-klagenfurt: Mínimo de inversión: «Desde 95 € la participación en reventa (21/11)» → «Desde 95 € la participación en reventa (26/11)»
- vivienda-stallhofstra-e-28-gratwein: Mínimo de inversión: «Desde 68,80 € la participación en reventa (21/11)» → «Desde 70 € la participación en reventa (26/11)»
- vivienda-schwarzer-weg-18-graz: Mínimo de inversión: «Desde 71,00 € la participación en reventa (21/11)» → «Desde 71 € la participación en reventa (26/11)»
- drautalresidenz-paternion: Mínimo de inversión: «Desde 70 € la participación en reventa (21/11)» → «Desde 70 € la participación en reventa (26/11)»
- randhartingergasse-9-viena: Mínimo de inversión: «Desde 78 € la participación en reventa (21/11)» → «Desde 78 € la participación en reventa (26/11)»
- apartamento-vacacional-hinterstoder-50: Mínimo de inversión: «Desde 75 € la participación en reventa (21/11)» → «Desde 77 € la participación en reventa (26/11)»
- vivienda-pottendorfer-stra-e-62-wr-neustadt: Mínimo de inversión: «Desde 81 € la participación en reventa (21/11)» → «Desde 81 € la participación en reventa (26/11)»
- fotovoltaica-greenpoint: Mínimo de inversión: «Desde 102 € la participación en reventa (21/11)» → «Desde 102 € la participación en reventa (26/11)»
- fotovoltaica-cohotel: Mínimo de inversión: «Desde 110 € la participación en reventa (21/11)» → «Desde 110 € la participación en reventa (26/11)»

## Sentencias del SQL que cambian (normalizado)

### bloque aprobar

- … con fuentes primarias «» → « releídas hoy»
- … expediente por oferta « y revisión independiente» → «»

### rwadar_catalogo.revisiones '<REVISION>'::uuid

- … que respaldan ( «» → «tres por lectura a mano: »
- …del registro REGAFI  «de la ACPR, » → «»
- … API pública,  «porque » → «las condiciones de Centrifuge con navegador y »
- …, porque la  «página cargaba sin esos datos» → «lista de la OCC descargada aparte; la documentación de Blocksquare para socios pide ahora iniciar sesión y se cita su web»

### rwadar_catalogo.fuentes 'https://docs.blocksquare.io/certified-partners/legal/terms-of-service.md' 'blocksquare-terms' (quitada)


### insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #4

- …:rwadar_catalogo.estado_licencia,' «Ya se pueden leer sus » → «Sus »
- … condiciones de uso «. Son una plantilla » → « »
- …plantilla para socios  «certificados (operador ''CP_COMPANY'') que declara que el operador » → «piden ahora iniciar sesión y »
- …el operador no  «presta servicios financieros licenciados ni regulados» → «se pueden leer como visitante»
- … ni regulados.  «No identifican » → «Su web no muestra »
- … entidad ni registro «,» → «»
- … registro, y  «la web » → «»
- …:rwadar_catalogo.estado_acceso,' «Los términos son una plantilla para » → «Blocksquare vende su tecnología a »
- … operadores de portales «: exigen KYC y control» → « y no publica condiciones»
- …y control de  «sanciones (ONU, UE, Reino Unido, OFAC) y dejan en blanco la jurisdicción» → «acceso que un visitante pueda leer»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro'

- …mostrada":"2, «45» → «44»
- …el valor liquidativo  «calculado el viernes 20/11/2026» → «del <FECHA> (1,063785 €)»
- …31 días ·  «20/11/2026» → «<FECHA>»
- …valor":"2, «45» → «44»
- … liquidativo, del  «20/11/2026» → «<FECHA>»
- …/2026 (1, «063496» → «063785»
- …valor":"2, «45» → «44»
- …,"fechaDato":" «2026-11-20» → «<FECHA>»
- …que publica Spiko  «(valor liquidativo calculado » → «con »
- …liquidativo calculado el  «20/11/2026, que Spiko fecha el 22/11/2026; consultado el » → «valor liquidativo del »
- …el <FECHA>  «y recalculado con los valores liquidativos fechados el 22/10 y el 22/11: » → «(»
- …/11: 1, «06131» → «063785»
- … 1,06131 € « → 1,063496 €)» → «), consultado el <FECHA>»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar'

- …{"mostrada":" «4» → «3»
- …mostrada":"4, «00» → «90»
- …por Spiko el  «20» → «25»
- … (VL del  «20» → «25»
- …31 días ·  «20» → «25»
- …,"valor":" «4» → «3»
- …valor":"4, «00» → «90»
- … liquidativo, del  «20» → «25»
- …/2026 (1, «103573» → «10413»
- …API. Sin alta «» → « por nuestra parte»
- …,"valor":" «4» → «3»
- …valor":"4, «00» → «90»
- …:"2026-11- «20» → «25»
- …valor liquidativo del  «20» → «25»
- …/11/2026,  «consultado el <FECHA> y recalculado con los valores liquidativos del 20/10 y del 20/11: » → «»
- …/11: 1, «099901» → «10413»
- … 1,099901 $ « → 1,103573 $» → «, consultado el <FECHA>»

### rwadar_catalogo.ofertas 'spiko-smart-cash-euro' 'https://www.spiko.io/es/spiko-euro'

- …valor liquidativo del  «20/11/2026» → «<FECHA>»
- …y variable ·  «20/11/2026» → «<FECHA>»
- …,"fechaDato":" «2026-11-20» → «<FECHA>»
- …valor liquidativo del  «20/11/2026» → «<FECHA>»

### rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill'

- …por token ·  «20» → «24»
- …valor":"1, «0789» → «0791»
- …semanas hasta el  «20» → «24»
- …valor":"3, «46» → «42»
- … emisor (del  «16» → «20»
- …16/10 al  «20» → «24»

### rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest'

- … 6,20 ZCHF « y ese día se vendieron » → «; la última venta, del 21/11/2026, fue de »
- …(62 acciones,  «<FECHA>» → «21/11/2026»
- …,"fechaDato":" «<FECHA>» → «2026-11-21»

### rwadar_catalogo.ofertas 'switzerlend' 'https://shares.lend.ch/'

- …,"valor":" «Bid/Ask 59.00 / 67.00 · Spread 11.94%» → «Sin órdenes de compra entre accionistas; la venta más barata pide 67,00 ZCHF»
- …alcance":"Libro  «de la página de operaciones » → «entre accionistas del portal leído el <FECHA> »
- … de operaciones ( «17» → «18»
- … operaciones (17: «45:29Z): una sola compra» → «17 UTC»
- … sola compra,  «4 acciones a 59,00 ZCHF. Solo ZCHF con monedero propio. Al vender se paga un 1» → «datos que usa el portal): ninguna orden de compra; la orden de venta más barata»
- …paga un 1, «9 % (pestaña «Sell»» → « 15 acciones a 67»
- …pestaña «Sell», « 17:47:22Z)» → «00 ZCHF»
- …47:22Z).  «El emisor no recompra» → «Cambia a diario»

### rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- …participación cuesta desde  «80» → «100»
- … 80 € ( «81» → «101»
- … € (81, «20» → «50»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …1 participación a  «80» → «100»
- …,00 € ( «81» → «101»
- … € (81, «20» → «50»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …,"valor":" «97» → «96»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace'

- …valor":"Desde  «68,80» → «70»
- …ese precio había  «1 participación» → «18 participaciones»
- …,"valor":" «68» → «70»
- …valor":"68, «80» → «00»
- … por participación ( «1» → «18»
- … ese precio,  «orden del 08/11/2026» → «en 6 órdenes de 6, 5, 1, 2, 2, 2»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …1 participación a  «68» → «70»
- …participación a 68, «80» → «00»
- …,80 € ( «69» → «71»
- … € (69, «83» → «05»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …,"valor":" «315» → «312»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- …":"Desde 71 «,00» → «»
- …, orden del  «<FECHA>» → «21/11/2026»
- … <FECHA> ( «22» → «18»
- …FECHA> (22: «38» → «17»
- … <FECHA> ( «22» → «18»
- …FECHA> (22: «38» → «17»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …,"valor":" «64» → «65»
- …, orden del  «12» → «23»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace'

- …valor":"Desde  «75» → «77»
- …,"valor":" «75» → «77»
- …, orden del  «08» → «03»
- …orden del 08/ «11» → «10»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …,"valor":" «252» → «247»
- …,"valor":" «20» → «75»
- …,00 € ( «4 participaciones en 2 órdenes; la más antigua » → «1 participación, orden »
- …más antigua del  «19» → «24»
- …antigua del 19/ «05» → «11»
- …del 19/05/ «2025» → «2026»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace'

- …ese precio había  «8» → «6»
- … por participación ( «8» → «6»
- … precio, en  «3» → «2»
- … de 5,  «2, » → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- …,"valor":" «347» → «345»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace'

- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»
- … <FECHA> ( «17» → «18»
- …FECHA> (17: «41–» → «»
- …(17:41–17 «:42» → «»

### rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/'

- … Hausera. Alicante  «2 ya está financiada; » → «3, »
- … financiada; la  «siguiente» → «última»
- … la siguiente,  «Alicante 3 (14 viviendas en Orihuela Costa» → «ya figura como financiada (<FECHA>»
- …en Orihuela Costa) «, abrió la preventa el 18/11 y » → « y Hausera no »
- …11 y anuncia  «la suscripción del 25/11/2026 al 30/06/2027» → «otra operación»
- …,"valor":" «» → «Ninguna anunciada: »
- …:"Alicante 3  «· preventa desde» → «figura como financiada»
- …preventa desde el  «18/11/2026; suscripción del 25/11/2026 al 30/06/2027» → «<FECHA>»
- …. Alicante 3  «abrió la preventa el 18/11/2026 y el <FECHA> aún » → «ya está financiada: »
- …> aún no  «estaba inscrita en el registro de la CNMV» → «queda importe por suscribir»
- … Hausera. Alicante  «2 ya está financiada; » → «3, »
- … financiada; la  «siguiente» → «última»
- … la siguiente,  «Alicante 3 (14 viviendas en Orihuela Costa» → «ya figura como financiada (<FECHA>»
- …en Orihuela Costa) «, abrió la preventa el 18/11 y » → « y Hausera no »
- …11 y anuncia  «la suscripción del 25/11/2026 al 30/06/2027» → «otra operación»
- …Historial publicado ·  «<FECHA>» → «21/11/2026»
- …,"fechaConsulta":" «<FECHA>» → «2026-11-21»
- …, consultada el  «<FECHA>» → «21/11/2026»
- …,"valor":" «Desde 100 € en » → «Sin operación abierta: »
- …en Alicante 3  «(documento de emisión); reserva desde el 18/11 y suscripción del 25/11/2026 al 30/06/2027.» → «ya está financiada (<FECHA>)»
- …","fechaDato": «null» → «"<FECHA>"»
- … <FECHA>.  «Documento» → «Lista»
- …. Documento de  «emisión» → «operaciones»
- …de emisión de  «Alicante 3, público en su ficha de » → «»
- … ficha de Hausera « sin iniciar sesión» → «»
- … iniciar sesión:  ««Ticket mínimo: 100,00 euros» (cuadro resumen) y 100 € por obligación (5.11)» → «Alicante 3 figura como financiada»
- …5.11);  «periodo de suscripción del 25/11/2026 al 30/6/2027 (5.9). La » → «no hay ninguna en »
- …. La preventa  «(reserva) abrió el 18/11/2026 según la ficha» → «ni abierta»

### rwadar_catalogo.fuentes 'https://blocksquare.io/' 'blocksquare-terms' (nueva)


## Lo que no se aplicó tal cual (0)

