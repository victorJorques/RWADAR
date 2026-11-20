# Qué cambia en la entrega 2026-11-20 (frente a la 2026-11-13)

Generado por el motor (`motor.mjs revisar 2026-11-20`) a partir de decisiones.json, el contraste y los dos SQL. Es el punto de partida de la revisión: cada revisor sigue haciendo sus propias pruebas.

- SQL de hoy: `aplicar-y-aprobar.sql` SHA-256 `cb27c32885c8430a6bb0dd7157d771cc6096245bcb9ead906c74bc6bc94d4f30`, revisión `eca89db7-aac5-35fa-f792-5bffbe8795e2`.
- Parte de la publicada `434217eb-9b7f-1cd9-a851-fbde7bced2bf` (huella `434217eb9b7f1cd9…`); último día vigente 27/11/2026.
- Inventario: las mismas filas por tabla que ayer (35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias del SQL que cambian algo más que la revisión, la huella y la fecha del día: **28** de 288.

## Cambios por ficha (167 en 22 fichas)

### spiko-letras-del-tesoro-euro

- rentabilidad: «2,40 % · Rendimiento neto anualizado de los últimos 31 días publicado por Spiko el 12/11/2026 (VL fechada el 12/11/2026); consultado el 13/11/2026. Variable y no garantizado.» → «2,45 % · Rendimiento neto anualizado de los últimos 31 días publicado por Spiko el 20/11/2026 (VL calculada el 20/11/2026, que Spiko fecha el 22/11/2026 porque cubre el fin de semana); consultado el 20/11/2026. Variable y no garantizado.»
- métrica: «Rentabilidad publicada · 31 días · 12/11/2026: 2,40 %» → «Rentabilidad publicada · 31 días · 20/11/2026: 2,45 %»
- referencia de la ficha: «Rentabilidad publicada · 31 días: 2,40 %» → «Rentabilidad publicada · 31 días: 2,45 %»
- métrica: «Supervisor: AMF (fondo) · inscrito en la CNMV para su comercialización, n.º 2380» → «Supervisor: AMF (fondo) · Spiko SICAV inscrita en la CNMV para su comercialización (n.º 2380); la CNMV no detalla sus fondos uno a uno»

### spiko-letras-del-tesoro-dolar

- rentabilidad: «3,98 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 12/11/2026 (VL del 12/11/2026); consultado el 13/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.» → «4,00 % · Rendimiento neto anualizado en dólares de los últimos 31 días publicado por Spiko el 20/11/2026 (VL del 20/11/2026); consultado el 20/11/2026. No incluye la variación del euro frente al dólar. Variable y no garantizado.»
- métrica: «Rentabilidad publicada · 31 días · 12/11/2026 · en USD: 3,98 %» → «Rentabilidad publicada · 31 días · 20/11/2026 · en USD: 4,00 %»
- referencia de la ficha: «Rentabilidad publicada · 31 días: 3,98 %» → «Rentabilidad publicada · 31 días: 4,00 %»
- métrica: «Supervisor: AMF (fondo) · inscrito en la CNMV para su comercialización, n.º 2380» → «Supervisor: AMF (fondo) · Spiko SICAV inscrita en la CNMV para su comercialización (n.º 2380); la CNMV no detalla sus fondos uno a uno»

### spiko-smart-cash-euro

- rentabilidad: «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 12/11/2026 (consultado el 13/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.» → «2,84 % · Tipo que publica Spiko, ya descontadas sus comisiones, con el valor liquidativo del 20/11/2026 (consultado el 20/11/2026); la web lo presenta como el tipo que paga cada día el banco con el que el fondo tiene el swap. Variable: sigue al €STR; no es un tipo fijo ni está garantizado.»
- métrica: «Rentabilidad publicada · neta y variable · 12/11/2026: 2,84 %» → «Rentabilidad publicada · neta y variable · 20/11/2026: 2,84 %»
- métrica: «Supervisor: AMF (Francia): n.º SCV20260075, autorizado el 17/02/2026 (ficha en su base GECO, aún sin clases de acciones ni valor liquidativo) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España» → «Supervisor: AMF (Francia): n.º SCV20260075, según el certificado de la AMF del 23/02/2026; el 20/11/2026 el fondo ya no aparece en la base pública de la AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España»
- referencia de la ficha: «Rendimiento neto publicado: 2,84 %» → «Rendimiento neto publicado: 2,84 %»
- referencia de la ficha: «Aprobación del compartimento: Autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y certificado de la AMF del 23/02/2026)» → «Aprobación del compartimento: N.º SCV20260075, en la lista de compartimentos del certificado de la AMF del 23/02/2026»
- descripción: «autorizado por la AMF el 17/02/2026 con el n.º SCV20260075 (ficha pública en GECO y certificado de la AMF del 23/02/2026)» → «autorizado por la AMF con el n.º SCV20260075, según el certificado de la AMF del 23/02/2026»

### mtbill

- métrica: «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)» → «Valor por token · 20/11/2026: 1,0789 USD (oráculo del emisor)»
- métrica: «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD: 3,45 % anual» → «Rentabilidad pasada · 5 semanas hasta el 20/11/2026 · en USD: 3,46 % anual»
- aviso: «La rentabilidad es pasada y la calcula RWAdar con el valor que publica el emisor (del 06/10 al 10/11/2026): está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la futura.» → «La rentabilidad es pasada y la calcula RWAdar con el valor que publica el emisor (del 16/10 al 20/11/2026): está en dólares, no descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no garantiza la futura.»
- aviso: «Los límites de reembolso no coinciden: las Condiciones Finales dicen 25 % diario y retención de hasta el 5 %; el KID en español, 15 % diario y retención de hasta el 50 %.» → (se quita)
- aviso: (nuevo) → «Los límites de reembolso no coinciden: las Condiciones Finales dicen 25 % diario y retención de hasta el 5 %; el KID en español, 15 % diario y retención de hasta el 50 %. Las comisiones tampoco coinciden: las Condiciones Finales permiten hasta 0,2 % al suscribir de forma inmediata y hasta 0,05 % al reembolsar; el KID no cobra entrada ni reembolso estándar.»
- fuentes de la oferta: «https://docs.midas.app/resources/legal-product-documentation/mtbill · https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_priii_documents · https://docs.midas.app/llms-full.txt · https://midas.app/mtbill» → «https://docs.midas.app/resources/legal-product-documentation/mtbill · https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_priii_documents · https://docs.midas.app/llms-full.txt · https://midas.app/mtbill · https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_sign…»
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: mTBILL: Midas Software GmbH · «Public offer under the EU Prospectus Regulation» · offer: public» → (se quita)
- referencia de la ficha: (nuevo) → «Países de oferta pública · Condiciones Finales del 17/07/2026: Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany»
- fuente de la ficha: (nuevo) → «https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media»

### kraken-xstocks

- resumen: «Certificados de deuda de Backed Assets (JE), sociedad de Jersey del grupo de Kraken, que siguen el precio de más de 130 acciones y ETF de EE. UU. No son las acciones: dependen de la solvencia del emisor. Los vende Kraken UE desde Chipre.» → «Certificados de deuda de Backed Assets (JE), sociedad de Jersey del grupo de Kraken, que siguen el precio de más de 1.000 acciones y ETF de EE. UU. No son las acciones: dependen de la solvencia del emisor. Los vende Kraken UE desde Chipre.»
- referencia de la ficha: «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.» → «Dividendos: No se cobran: se suman al saldo, netos de una retención del 30 % en EE. UU.»
- referencia de la ficha: «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado» → «Países de oferta (condiciones finales): Liechtenstein y Suiza (en Suiza, solo a inversores profesionales); el derecho a ofrecer en otros países queda reservado»
- fuente de la ficha: (nuevo) → «https://sppdownloaddocumentservice.l-p-a.com/api/DownloadDocument/UPI/CH1588667217/BF%20Final%20Terms%20AND%20Summary%20(PDF)»

### robinhood-classic-stock-tokens

- aviso: (nuevo) → «Producto complejo según su KID: puedes perder todo lo invertido.»

### prosegur-digital-gold

- métrica: «Custodia: Oro en inventario común custodiado por Prosegur (sin lingote asignado)» → «Custodia: Según su contrato, oro separado de los bienes de Prosegur, en un inventario conjunto de los clientes (sin lingote asignado)»

### vivienda-pluddemanngasse-101-graz

- referencia de la ficha: «Venta más barata · 13/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)» → «Venta más barata · 20/11/2026: 75,00 € por participación (2 a ese precio, orden del 04/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 99,00 € (100,49 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 335» → «Participaciones en venta · 20/11/2026: 335»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 20,00 € (1 participación, orden del 23/04/2026)» → «Mejor oferta de compra · 20/11/2026: 20,00 € (1 participación, orden del 23/04/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,58 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 3,76 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### vivienda-sonnleithnergasse-2-viena

- referencia de la ficha: «Venta más barata · 13/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)» → «Venta más barata · 20/11/2026: 75,00 € por participación (11 a ese precio, orden del 28/04/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 80,00 € (81,20 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 80,00 € (81,20 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 97» → «Participaciones en venta · 20/11/2026: 97»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 65,00 € (1 participación, orden del 16/10/2026)» → «Mejor oferta de compra · 20/11/2026: 65,00 € (2 participaciones en 2 órdenes; la más antigua del 16/10/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,42 %» → (se quita)
- referencia de la ficha: «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026: 3,52 %» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### local-de-estanco-klagenfurt

- referencia de la ficha: «Venta más barata · 13/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)» → «Venta más barata · 20/11/2026: 95,00 € por participación (16 a ese precio, en 3 órdenes)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 95,00 € (96,43 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 95 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 95 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 302» → «Participaciones en venta · 20/11/2026: 299»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 15,00 € (1 participación, orden del 21/09/2026)» → «Mejor oferta de compra · 20/11/2026: 15,00 € (1 participación, orden del 21/09/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,46 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 3,46 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Rentabilidad · consulta 01/11/2026: "rentalReturn":3.46; rentalSurplus=11828.12» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### vivienda-stallhofstra-e-28-gratwein

- referencia de la ficha: «Venta más barata · 13/11/2026: 68,80 € por participación (1 a ese precio, orden del 08/11/2026)» → «Venta más barata · 20/11/2026: 68,80 € por participación (1 a ese precio, orden del 08/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 68,80 € (69,83 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 68,80 € (69,83 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 68,80 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 68,80 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 317» → «Participaciones en venta · 20/11/2026: 315»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 30,00 € (1 participación, orden del 01/07/2026)» → «Mejor oferta de compra · 20/11/2026: 30,00 € (1 participación, orden del 01/07/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 4,42 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 4,11 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### vivienda-schwarzer-weg-18-graz

- referencia de la ficha: «Venta más barata · 13/11/2026: 69,90 € por participación (1 a ese precio, orden del 27/10/2026)» → «Venta más barata · 20/11/2026: 69,90 € por participación (1 a ese precio, orden del 27/10/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 69,90 € (70,95 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 69,90 € (70,95 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 69,90 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 69,90 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 299» → «Participaciones en venta · 20/11/2026: 298»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 60,00 € (1 participación, orden del 10/11/2026)» → «Mejor oferta de compra · 20/11/2026: 62,00 € (1 participación, orden del 17/11/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,46 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 3,46 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### drautalresidenz-paternion

- referencia de la ficha: «Venta más barata · 13/11/2026: 70,00 € por participación (3 a ese precio, orden del 18/10/2026)» → «Venta más barata · 20/11/2026: 70,00 € por participación (1 a ese precio, orden del 17/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 84,00 € (85,26 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 70,00 € (71,05 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 70 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 70 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 150» → «Participaciones en venta · 20/11/2026: 147»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 60,00 € (1 participación, orden del 05/11/2026)» → «Mejor oferta de compra · 20/11/2026: 50,00 € (1 participación, orden del 29/09/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 5,96 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 4,68 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Rentabilidad · consulta 01/11/2026: "rentalReturn":4.83; rentalSurplus=5206.62» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### randhartingergasse-9-viena

- referencia de la ficha: «Venta más barata · 13/11/2026: 78,00 € por participación (21 a ese precio, en 2 órdenes)» → «Venta más barata · 20/11/2026: 78,00 € por participación (20 a ese precio, orden del 29/06/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 78,00 € (79,17 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 85,00 € (86,28 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 78 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 78 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 189» → «Participaciones en venta · 20/11/2026: 188»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 64,00 € (1 participación, orden del 12/11/2026)» → «Mejor oferta de compra · 20/11/2026: 64,00 € (1 participación, orden del 12/11/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,09 %» → (se quita)
- referencia de la ficha: «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026: 2,47 %» → (se quita)
- referencia de la ficha: «Participaciones disponibles en emisión (API) · 22/10/2026: 374 de 2.670» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- aviso: (nuevo) → «Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»

### apartamento-vacacional-hinterstoder-50

- referencia de la ficha: «Venta más barata · 13/11/2026: 75,00 € por participación (5 a ese precio, orden del 08/11/2026)» → «Venta más barata · 20/11/2026: 75,00 € por participación (5 a ese precio, orden del 08/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 90,00 € (91,35 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 82,00 € (83,23 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 75 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 75 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 265» → «Participaciones en venta · 20/11/2026: 252»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)» → «Mejor oferta de compra · 20/11/2026: 20,00 € (4 participaciones en 2 órdenes; la más antigua del 19/05/2025)»
- referencia de la ficha: «Distribución anual prevista anunciada: 4,65 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 4,84 %» → (se quita)
- referencia de la ficha: «Próxima distribución esperada · 22/10/2026: 15/11/2026» → (se quita)
- referencia de la ficha: «Rentabilidad · consulta 01/11/2026: "rentalReturn":4.1; rentalSurplus=14233.22» → (se quita)
- referencia de la ficha: «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token erfolgt ausschließlich eigenverantwortlich durch den Anleger.» → «Custodia · consulta 01/11/2026: Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den Anleger zu erfolgen.»
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»
- aviso: (nuevo) → «Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).»
- referencia de la ficha: «Qué se adquiere · consulta 01/11/2026: Genussscheine ... läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.» → «Qué se adquiere · consulta 01/11/2026: Das Produkt läuft endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.»

### vivienda-pottendorfer-stra-e-62-wr-neustadt

- referencia de la ficha: «Venta más barata · 13/11/2026: 80,00 € por participación (11 a ese precio, orden del 08/02/2026)» → «Venta más barata · 20/11/2026: 81,00 € por participación (1 a ese precio, orden del 15/11/2026)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 115,00 € (116,73 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 81,00 € (82,22 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 80 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 81 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 106» → «Participaciones en venta · 20/11/2026: 96»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 19,00 € (3 participaciones, orden del 06/11/2025)» → «Mejor oferta de compra · 20/11/2026: 64,00 € (1 participación, orden del 17/11/2026)»
- referencia de la ficha: «Distribución anual prevista anunciada: 3,80 %» → (se quita)
- referencia de la ficha: «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026: 4,22 %» → (se quita)
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### fotovoltaica-greenpoint

- referencia de la ficha: «Venta más barata · 13/11/2026: 102,00 € por participación (8 a ese precio, en 3 órdenes de 5, 2, 1)» → «Venta más barata · 20/11/2026: 102,00 € por participación (8 a ese precio, en 3 órdenes de 5, 2, 1)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 102 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 102 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 347» → «Participaciones en venta · 20/11/2026: 347»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 84,00 € (1 participación, orden del 23/06/2026)» → «Mejor oferta de compra · 20/11/2026: 29,00 € (1 participación, orden del 10/08/2024)»
- referencia de la ficha: «Distribución anual prevista anunciada: 6,11 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 6,11 %» → (se quita)
- referencia de la ficha: «Rentabilidad · consulta 01/11/2026: "rentalReturn":6.43; rentalSurplus=10942.56» → (se quita)
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### fotovoltaica-cohotel

- referencia de la ficha: «Venta más barata · 13/11/2026: 102,00 € por participación (1 a ese precio, orden del 11/11/2026)» → «Venta más barata · 20/11/2026: 110,00 € por participación (35 a ese precio, en 2 órdenes de 31, 4)»
- referencia de la ficha: «Orden de venta de menor importe · 13/11/2026: 1 participación a 102,00 € (103,53 € con el 1,5 %)» → «Orden de venta de menor importe · 20/11/2026: 1 participación a 120,00 € (121,80 € con el 1,5 %)»
- tarjeta: «Mínimo de inversión: Desde 102 € la participación en reventa (13/11)» → «Mínimo de inversión: Desde 110 € la participación en reventa (20/11)»
- referencia de la ficha: «Participaciones en venta · 13/11/2026: 59» → «Participaciones en venta · 20/11/2026: 59»
- referencia de la ficha: «Mejor oferta de compra · 13/11/2026: 3,00 € (1 participación, orden del 23/11/2024)» → «Mejor oferta de compra · 20/11/2026: 3,00 € (1 participación, orden del 23/11/2024)»
- referencia de la ficha: «Distribución anual prevista anunciada: 5,57 %» → (se quita)
- referencia de la ficha: «Distribución anual esperada · 22/10/2026: 5,57 %» → (se quita)
- referencia de la ficha: «Rentabilidad · consulta 01/11/2026: "rentalReturn":5.11; rentalSurplus=4909.64» → (se quita)
- referencia de la ficha: «Destino de consulta comprobado: Mercado público de Brickwise» → «Destino de consulta comprobado: Mercado público de Brickwise»

### aktionariat

- métrica: «Precio del emisor · 13/11/2026: 7,25 CHF por acción (fijo)» → «Precio del emisor · 20/11/2026: 7,25 CHF por acción (fijo)»
- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (13/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026)»
- aviso: «Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el 13/11/2026).» → «Entre accionistas hay vendedores por debajo del precio del emisor (6,20 ZCHF frente a 7,25 CHF el 20/11/2026).»
- aviso: (nuevo) → «Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.»

### boss-info

- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (13/11/2026)» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026)»
- aviso: «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 13/11/2026).» → «El precio del emisor está por encima de la mejor oferta de venta entre accionistas (venta más barata 8,40 ZCHF el 20/11/2026).»
- tarjeta: «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 13/11)» → «Mínimo de inversión: 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 20/11)»
- referencia de la ficha: «Última operación · 13/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)» → «Última operación · 20/11/2026: 8,40 ZCHF (1 acción, 05/11/2026)»
- aviso: (nuevo) → «Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.»

### switzerlend

- aviso: «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 13/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).» → «Su web dice que el emisor recompra acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el 20/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF).»
- aviso: «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 13/11/2026).» → «Entre accionistas hay vendedores por debajo del precio del emisor (venta más barata 67,00 ZCHF el 20/11/2026).»
- tarjeta: «Mínimo de inversión: 1 acción (68,01 CHF el 13/11)» → «Mínimo de inversión: 1 acción (68,01 CHF el 20/11)»
- métrica: «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (13/11/2026); afiliada a PolyReg solo a efectos de blanqueo» → «Supervisor: Sin supervisión prudencial: no figura en el registro de autorizados de FINMA (20/11/2026); afiliada a PolyReg solo a efectos de blanqueo»
- aviso: (nuevo) → «Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.»

### hausera-proximas-ofertas

- resumen: «Seguimiento de las operaciones inmobiliarias de Hausera. El 10/11/2026 Alicante 2 ya figuraba como financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), abre la preventa el 18/11 y la suscripción el 25/11/2026.» → «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 2 ya está financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), tiene la preventa abierta desde el 18/11 y la suscripción anunciada del 25/11/2026 al 30/06/2027.»
- métrica: «Próxima operación: Alicante 3 · preventa desde el 18/11/2026, suscripción del 25/11/2026 al 30/06/2027» → «Próxima operación: Alicante 3 · preventa abierta desde el 18/11/2026; suscripción del 25/11/2026 al 30/06/2027»
- aviso: «El documento de emisión no es un folleto y la CNMV no lo ha revisado. El 13/11/2026 Alicante 3 aún no estaba inscrita en el registro de la CNMV.» → «El documento de emisión no es un folleto y la CNMV no lo ha revisado. El 20/11/2026, con la preventa ya abierta, Alicante 3 aún no estaba inscrita en el registro de la CNMV.»
- tarjeta: «Mínimo de inversión: Desde 100 € en Alicante 3, según su documento de emisión (13/11); la preventa abre el 18/11.» → «Mínimo de inversión: Desde 100 € en Alicante 3, según su documento de emisión (20/11); preventa abierta desde el 18/11.»
- referencia de la ficha: «Historial publicado · 13/11/2026: 42 operaciones, 24 terminadas, 128 M€ financiados» → «Historial publicado · 20/11/2026: 42 operaciones, 24 terminadas, 128 M€ financiados»
- referencia de la ficha: «Destino de consulta comprobado: Plataforma inmobiliaria Hausera» → «Destino de consulta comprobado: Plataforma inmobiliaria Hausera»

## Tarjetas que cambian (14)

- boss-info: Mínimo de inversión: «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 13/11)» → «100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 20/11)»
- switzerlend: Mínimo de inversión: «1 acción (68,01 CHF el 13/11)» → «1 acción (68,01 CHF el 20/11)»
- hausera-proximas-ofertas: Mínimo de inversión: «Desde 100 € en Alicante 3, según su documento de emisión (13/11); la preventa abre el 18/11.» → «Desde 100 € en Alicante 3, según su documento de emisión (20/11); preventa abierta desde el 18/11.»
- vivienda-pluddemanngasse-101-graz: Mínimo de inversión: «Desde 75 € la participación en reventa (13/11)» → «Desde 75 € la participación en reventa (20/11)»
- vivienda-sonnleithnergasse-2-viena: Mínimo de inversión: «Desde 75 € la participación en reventa (13/11)» → «Desde 75 € la participación en reventa (20/11)»
- local-de-estanco-klagenfurt: Mínimo de inversión: «Desde 95 € la participación en reventa (13/11)» → «Desde 95 € la participación en reventa (20/11)»
- vivienda-stallhofstra-e-28-gratwein: Mínimo de inversión: «Desde 68,80 € la participación en reventa (13/11)» → «Desde 68,80 € la participación en reventa (20/11)»
- vivienda-schwarzer-weg-18-graz: Mínimo de inversión: «Desde 69,90 € la participación en reventa (13/11)» → «Desde 69,90 € la participación en reventa (20/11)»
- drautalresidenz-paternion: Mínimo de inversión: «Desde 70 € la participación en reventa (13/11)» → «Desde 70 € la participación en reventa (20/11)»
- randhartingergasse-9-viena: Mínimo de inversión: «Desde 78 € la participación en reventa (13/11)» → «Desde 78 € la participación en reventa (20/11)»
- apartamento-vacacional-hinterstoder-50: Mínimo de inversión: «Desde 75 € la participación en reventa (13/11)» → «Desde 75 € la participación en reventa (20/11)»
- vivienda-pottendorfer-stra-e-62-wr-neustadt: Mínimo de inversión: «Desde 80 € la participación en reventa (13/11)» → «Desde 81 € la participación en reventa (20/11)»
- fotovoltaica-greenpoint: Mínimo de inversión: «Desde 102 € la participación en reventa (13/11)» → «Desde 102 € la participación en reventa (20/11)»
- fotovoltaica-cohotel: Mínimo de inversión: «Desde 102 € la participación en reventa (13/11)» → «Desde 110 € la participación en reventa (20/11)»

## Sentencias del SQL que cambian (normalizado)

### rwadar_catalogo.revisiones '<REVISION>'::uuid

- … que respaldan ( «las dos » → «la de pasaportes »
- …página cargaba sin  «» → «esos »

### insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #13

- …por la FMA. « No se obtuvieron los términos finales vigentes de mTBILL.» → «»
- …:rwadar_catalogo.estado_acceso,' «No se obtuvieron términos » → «Las condiciones »
- …obtuvieron términos finales  «vigentes que permitan confirmar acceso minorista, mínimo » → «de mTBILL (17/07/2026) incluyen España entre los países »
- …, mínimo de  «inversión o elegibilidad desde España» → «la oferta pública y no prohíben la venta a minoristas del EEE»
- …elegibilidad desde España. «» → « Eso no confirma que la web te deje darte de alta.»

### insert into rwadar_catalogo.alertas (revision_id,plataforma_id,codigo,detalle) s #13

- …EEE lo deciden  «los términos» → «las condiciones»
- …los términos finales  «vigentes » → «»
- … vigentes de mTBILL «» → «; las del 17/07/2026 no lo prohíben»
- … de mTBILL,  «que » → «pero eso »
- …, que no  «hemos podido obtener» → «confirma que la web te deje darte de alta»

### insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #16

- …banks activos a  «30» → «31»
- …activos a 30/ «09» → «10»

### insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonic #17

- …:rwadar_catalogo.estado_licencia,' «La fuente primaria localizada acredita una emisión española concreta con ERIR; » → «Reental dice que su actividad en España »
- … ERIR; no  «acredita una » → «está sujeta a »
- …acredita una autorización  «general de Reental como empresa » → «ni registro previo »
- …como empresa de  «servicios de inversión» → «la CNMV»

### insert into rwadar_catalogo.plataforma_fuentes (revision_id,plataforma_id,campo, #67

- ….campo_plataforma,'reental- «emision» → «web»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro'

- …mostrada":"2, «40» → «45»
- …por Spiko el  «12/11/2026» → «<FECHA>»
- …/2026 (VL  «fechada» → «calculada»
- …VL fechada el  «12» → «<FECHA>, que Spiko fecha el 22»
- … 12/11/2026 «» → « porque cubre el fin de semana»
- …(fondo) ·  «inscrito » → «Spiko SICAV inscrita »
- … para su comercialización «, » → « (»
- … n.º 2380 «» → «); la CNMV no detalla sus fondos uno a uno»
- …31 días ·  «12/11/2026» → «<FECHA>»
- …valor":"2, «40» → «45»
- …valor":"2, «40» → «45»
- …,"fechaDato":" «2026-11-12» → «<FECHA>»
- … (valor liquidativo  «del 12/11/2026» → «calculado el <FECHA>»
- …, que Spiko  «calculó ese día» → «fecha el 22/11/2026»
- …los valores liquidativos  «del 12» → «fechados el 22»
- …12/10 y  «del 12» → «el 22»
- …/11: 1, «060664» → «06131»
- …€ → 1, «062803» → «063496»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar'

- …{"mostrada":" «3» → «4»
- …mostrada":"3, «98» → «00»
- …por Spiko el  «12/11/2026» → «<FECHA>»
- … (VL del  «12/11/2026» → «<FECHA>»
- …(fondo) ·  «inscrito » → «Spiko SICAV inscrita »
- … para su comercialización «, » → « (»
- … n.º 2380 «» → «); la CNMV no detalla sus fondos uno a uno»
- …31 días ·  «12/11/2026» → «<FECHA>»
- …,"valor":" «3» → «4»
- …valor":"3, «98» → «00»
- …,"valor":" «3» → «4»
- …valor":"3, «98» → «00»
- …,"fechaDato":" «2026-11-12» → «<FECHA>»
- …valor liquidativo del  «12/11/2026» → «<FECHA>»
- …valores liquidativos del  «13» → «20»
- …10 y del  «12/11, porque el 12/10 fue festivo en EE. UU.» → «<FECHA>»
- …UU.: 1, «099159» → «099901»
- …$ → 1, «102694» → «103573»

### rwadar_catalogo.ofertas 'spiko-smart-cash-euro' 'https://www.spiko.io/es/spiko-euro'

- …valor liquidativo del  «12/11/2026» → «<FECHA>»
- ….º SCV20260075,  «autorizado» → «según»
- …, autorizado el  «17» → «certificado de la AMF del 23»
- … 17/02/2026 « (ficha en su base GECO, aún sin clases de acciones ni valor liquidativo» → «; el <FECHA> el fondo ya no aparece en la base pública de la AMF (GECO»
- …y variable ·  «12/11/2026» → «<FECHA>»
- …por la AMF  «el 17/02/2026 » → «»
- … n.º SCV20260075 « (ficha pública en GECO y » → «, según el »
- … 23/02/2026 «)» → «»
- …,"fechaDato":" «2026-11-12» → «<FECHA>»
- …valor liquidativo del  «12/11/2026» → «<FECHA>»
- …,"valor":" «Autorizado por la AMF el 17/02/2026 con el n» → «N»
- … n.º SCV20260075 « (ficha pública en GECO y » → «, en la lista de compartimentos del »
- … 23/02/2026 «)» → «»
- …:"2026-02- «17» → «23»
- …,"fechaConsulta":" «2026-11-10» → «<FECHA>»
- …:"https:// «geco» → «cdn»
- …https://geco. «amf-france» → «spiko»
- …geco.amf-france. «org» → «finance»
- …amf-france.org/ «produit-d-epargne» → «legal_docs»
- …produit-d-epargne/ «c124199» → «EN/SAFO_Letter_EN.pdf»
- …,"alcance":" «Ficha pública del compartimento en la base GECO » → «Certificado »
- … de la AMF «, consultada el 10/11/2026» → « que aloja Spiko»
- …/11/2026:  «n.º SCV20260075, autorizado el 17/02/2026, vivo y abierto a todos los suscriptores; aún sin clases » → «incluye SPIKO AMUNDI OVERNIGHT SWAP FUND (SCV20260075) entre los compartimentos de Spiko SICAV. No da la fecha »
- …sin clases de  «acciones » → «autorización del compartimento »
- …de acciones ni  «valor liquidativo. Lo confirma el certificado de » → «dice en qué países se vende. El <FECHA> »
- …certificado de la  «AMF» → «ficha»
- …la AMF del  «23/02/2026 que aloja Spiko. No dice en qué países se comercializa» → «fondo ya no aparece en la base pública de la AMF (GECO)»

### rwadar_catalogo.ofertas 'robinhood-classic-stock-tokens' 'https://robinhood.com/eu/es/invest'

- …"<FECHA>"} «» → «,{"texto":"Producto complejo según su KID: puedes perder todo lo invertido.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»

### rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill'

- …por token ·  «10/11/2026» → «<FECHA>»
- …valor":"1, «0777» → «0789»
- …semanas hasta el  «10/11/2026» → «<FECHA>»
- …valor":"3, «45» → «46»
- …el 50 %. «» → « Las comisiones tampoco coinciden: las Condiciones Finales permiten hasta 0,2 % al suscribir de forma inmediata y hasta 0,05 % al reembolsar; el KID no cobra entrada ni reembolso estándar.»
- … emisor (del  «06» → «16»
- …06/10 al  «10/11/2026» → «<FECHA>»
- …midas.app/mtbill" «» → «,"https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media","https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV…»
- …/midas.app/" «» → «,"https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media"»
- …{"etiqueta":" «Acceso desde España · consulta 01/11/2026","valor":"mTBILL: Midas Software GmbH · «Public offer under the EU Prospectus Regulation» · offer: public","fechaDato":null,"fechaConsulta":"2026-11-01","fuente":"https://midas.app/assets/main-DOxid0Zj.js","alcance":"Configuración de la propia web; coincide …» → «»
- …de reembolso."} «» → «,{"etiqueta":"Países de oferta pública · Condiciones Finales del 17/07/2026","valor":"Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany","fechaDato":"2026-07-17","fe…»

### rwadar_catalogo.ofertas 'prosegur-digital-gold' 'https://www.prosegurcrypto.com/digital-gold'

- …,"valor":" «Oro » → «Según su contrato, oro separado de los bienes de Prosegur, »
- …:"Oro en  «» → «un »
- …Oro en inventario  «común custodiado por Prosegur» → «conjunto de los clientes»

### rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest'

- …"<FECHA>"} «» → «,{"texto":"Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»

### rwadar_catalogo.ofertas 'kraken-xstocks' 'https://eu.kraken.com/xstocks'

- …de más de  «130» → «1.000»
- …de más de  «130» → «1.000»
- …LITEx)_20260326.pdf" «» → «,"https://sppdownloaddocumentservice.l-p-a.com/api/DownloadDocument/UPI/CH1588667217/BF%20Final%20Terms%20AND%20Summary%20(PDF)"»
- …fechaDato":"2026- «03» → «11»
- …:"2026-03- «26» → «19»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …:"https:// «cdn» → «sppdownloaddocumentservice»
- …https://cdn. «prod.website» → «l»
- …cdn.prod.website- «files» → «p-a»
- …website-files.com/ «655f3efc4be468487052e35a» → «api»
- …files.com/655f3efc4be468487052e35a/ «69c684c9cf6e1070cfdd8851_Backed» → «DownloadDocument/UPI/CH1588667217/BF»
- …com/655f3efc4be468487052e35a/69c684c9cf6e1070cfdd8851_Backed% «20Assets_Final» → «20Final»
- …69c684c9cf6e1070cfdd8851_Backed%20Assets_Final%20Terms% «20Nr» → «20AND»
- …20Assets_Final%20Terms%20Nr% «20159» → «20Summary»
- …20Nr%20159%20( «LITEx» → «PDF»
- …20159%20(LITEx) «_20260326.pdf» → «»
- …finales del producto  «n.º 159 » → «ANTx »
- ….º 159 ( «LITEx» → «CH1588667217»
- …159 (LITEx,  «26» → «19»
- …(LITEx, 26/ «03» → «11»
- …con el folleto  «de 2025» → «vigente»
- …folleto de 2025) « alojadas en la web oficial » → «, publicadas por el agente de pago »
- … oficial del emisor «; las de 2026 que se leyeron » → «: «The Products will be offered in Liechtenstein and Switzerland (only to Swiss Professional Investors)». Las de LITEx (26/03/2026) »
- …fechaDato":"2026- «10» → «11»
- …:"2026-10- «30» → «11»
- …,"fechaConsulta":" «2026-11-03» → «<FECHA>»
- …, actualizadas el  «30» → «11»
- …actualizadas el 30/ «10» → «11»

### rwadar_catalogo.ofertas 'boss-info' 'https://shares.bossinfo.com/'

- …"<FECHA>"} «» → «,{"texto":"Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …El <FECHA>  «se comprobaron el» → «la portada del»
- … comprobaron el portal «, que el historial de operaciones es igual byte a byte que el del 12/11 » → « sigue enseñándola como la última »
- … 12/11 ( «ninguna operación nueva) y, en la cadena de bloques, la operación (05/11/» → ««Last trade • 5 Nov »
- …2026, 13:35 «:35 UTC, contrato del mercado entre accionistas» → «»»
- …mercado entre accionistas) « y lo » → «. Lo »
- … recibió quien vendió «:» → «,»
- …es la comisión) «» → «, se comprobó en la cadena de bloques el 13/11/2026 y hoy no se ha vuelto a leer»

### rwadar_catalogo.ofertas 'switzerlend' 'https://shares.lend.ch/'

- …"<FECHA>"} «» → «,{"texto":"Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el dinero invertido.","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»

### rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,58 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"3,76 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,42 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026","valor":"3,52 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://www.brickwise.at/assets/at0000a2t4d7","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegi…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,00 € ( «1 participación, orden » → «2 participaciones en 2 órdenes; la más antigua »
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,46 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"3,46 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Rentabilidad · consulta 01/11/2026","valor":"\"rentalReturn\":3.46; rentalSurplus=11828.12","fechaDato":"2026-10-27","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2u5v3","alcance":"Rentabilidad por alquiler esperada que calcula la API: excedente anual previsto (11828.…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «302» → «299»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"4,42 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"4,11 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «317» → «315»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,46 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"3,46 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «299» → «298»
- …,"valor":" «60» → «62»
- …, orden del  «10» → «17»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"5,96 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"4,68 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Rentabilidad · consulta 01/11/2026","valor":"\"rentalReturn\":4.83; rentalSurplus=5206.62","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2ypq0","alcance":"Rentabilidad por alquiler esperada que calcula la API: excedente anual previsto (5206.62…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- …ese precio había  «3 participaciones» → «1 participación»
- … por participación ( «3» → «1»
- …, orden del  «18» → «17»
- …orden del 18/ «10» → «11»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …1 participación a  «84» → «70»
- …,00 € ( «85» → «71»
- … € (85, «26» → «05»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «150» → «147»
- …,"valor":" «60» → «50»
- …, orden del  «05» → «29»
- …orden del 05/ «11» → «09»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- …"<FECHA>"} «» → «,{"texto":"Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,09 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026","valor":"2,47 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://www.brickwise.at/assets/at0000a2zt84","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegi…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- …ese precio había  «21» → «20»
- … por participación ( «21» → «20»
- … ese precio,  «en 2 órdenes» → «orden del 29/06/2026»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …1 participación a  «78» → «85»
- …,00 € ( «79» → «86»
- … € (79, «17» → «28»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «189» → «188»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace'

- …"<FECHA>"} «» → «,{"texto":"Para comprar esta emisión, quien no tributa en Austria debe dar antes un número fiscal austriaco: las rentas tributan en Austria y la ganancia al vender paga allí el impuesto inmobiliario (ImmoESt).","tono":"warn","esAntiguedad":false,"verificadaEl":"<FECHA>"}»
- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"4,65 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"4,84 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Próxima distribución esperada · 22/10/2026","valor":"15/11/2026","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Rentabilidad · consulta 01/11/2026","valor":"\"rentalReturn\":4.1; rentalSurplus=14233.22","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a31kp7","alcance":"Rentabilidad por alquiler esperada que calcula la API: excedente anual previsto (14233.2…» → «»
- …,"valor":" «Genussscheine ...» → «Das Produkt»
- …Übertragung der Token  «erfolgt ausschließlich » → «hat »
- … durch den Anleger «» → « zu erfolgen»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …1 participación a  «90» → «82»
- …,00 € ( «91» → «83»
- … € (91, «35» → «23»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «265» → «252»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"3,80 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026","valor":"4,22 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://www.brickwise.at/assets/at0000a324b4","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegi…» → «»
- …valor":"Desde  «80» → «81»
- …ese precio había  «11 participaciones» → «1 participación»
- …,"valor":" «80» → «81»
- … por participación ( «11» → «1»
- …, orden del  «08» → «15»
- …orden del 08/ «02» → «11»
- … <FECHA> ( «14» → «16»
- …FECHA> (14: «36» → «54–16:56»
- …1 participación a  «115» → «81»
- …,00 € ( «116» → «82»
- … € (116, «73» → «22»
- … <FECHA> ( «14» → «16»
- …FECHA> (14: «36» → «54–16:56»
- …,"valor":" «106» → «96»
- …,"valor":" «19» → «64»
- …,00 € ( «3 participaciones» → «1 participación»
- …, orden del  «06» → «17»
- …del 06/11/ «2025» → «2026»
- … <FECHA> ( «14» → «16»
- …FECHA> (14: «36» → «54–16:56»

### rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"6,11 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"6,11 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Rentabilidad · consulta 01/11/2026","valor":"\"rentalReturn\":6.43; rentalSurplus=10942.56","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://bwrealestate.app.brickwise.at/api/v1/asset/AT0000A38J32","alcance":"Rendimiento esperado que calcula la API para la instalación: exceden…» → «»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …,"valor":" «84» → «29»
- …, orden del  «23» → «10»
- …orden del 23/ «06» → «08»
- …del 23/06/ «2026» → «2024»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Distribución anual prevista anunciada","valor":"5,57 %","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Estimación declarada por la tarjeta individual, sin fecha de cálculo publicada. No es rentabilidad garantizada, realizada ni rev…» → «»
- …del proveedor comprobado  «el30» → «el 30»
- …{"etiqueta":" «Distribución anual esperada · 22/10/2026","valor":"5,57 %","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabili…» → «»
- …{"etiqueta":" «Rentabilidad · consulta 01/11/2026","valor":"\"rentalReturn\":5.11; rentalSurplus=4909.64","fechaDato":"2026-10-08","fechaConsulta":"2026-11-01","fuente":"https://bwrealestate.app.brickwise.at/api/v1/asset/AT0000A38J40","alcance":"Rendimiento esperado que calcula la API para la instalación: excedent…» → «»
- …valor":"Desde  «102» → «110»
- …ese precio había  «1 participación» → «35 participaciones»
- …,"valor":" «102» → «110»
- … por participación ( «1» → «35»
- … ese precio,  «orden del 11/11/2026» → «en 2 órdenes de 31, 4»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- …1 participación a  «102» → «120»
- …,00 € ( «103» → «121»
- … € (103, «53» → «80»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»
- … <FECHA> ( «08» → «16»
- …FECHA> (08: «30» → «54»
- … (08:30– «08» → «16»
- …08:30–08: «33» → «56»

### rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/'

- … de Hausera.  «El 10/11/2026 » → «»
- …Alicante 2 ya  «figuraba como » → «está »
- …Orihuela Costa),  «abre» → «tiene»
- …abre la preventa  «» → «abierta desde »
- …y la suscripción  «el » → «anunciada del »
- … 25/11/2026 «» → « al 30/06/2027»
- …3 · preventa  «» → «abierta »
- … 18/11/2026 «,» → «;»
- … El <FECHA> « » → «, con la preventa ya abierta, »
- … de Hausera.  «El 10/11/2026 » → «»
- …Alicante 2 ya  «figuraba como » → «está »
- …Orihuela Costa),  «abre» → «tiene»
- …abre la preventa  «» → «abierta desde »
- …y la suscripción  «el » → «anunciada del »
- … 25/11/2026 «» → « al 30/06/2027»
- …del proveedor comprobado  «el30» → «el 30»
- …<FECHA>);  «la » → «»
- …; la preventa  «abre » → «abierta desde »
- …El <FECHA>  «aún no se podía invertir: » → «»
- …: la preventa  «abre » → «estaba abierta (desde »
- … 18/11/2026 «» → «)»
- … y la suscripción «, » → « empieza »

## Lo que no se aplicó tal cual (10)

- spiko-smart-cash-euro: Quitar la dirección de la ficha GECO c124199 (https://geco.amf-france.org/produit-d-epargne/c124199), que ya no se publica, de la lista de fuentes de la ficha (documentacion-ofertas.json, «fuentes»)
- spiko-smart-cash-euro: Corregir también el claim del expediente que dice «según el certificado de la AMF y el folleto» (DECISIONES §2: «Igual en el claim del expediente»)
- varias (Spiko ×3, Kraken, Robinhood y Prosegur Digital Gold): Textos nuevos de la tarjeta que proponen los expedientes (mínimo, acceso desde España o salida) con el mismo fondo y otra redacción
- spiko-letras-del-tesoro-euro, spiko-letras-del-tesoro-dolar y spiko-smart-cash-euro: A3 · referencia de la tarjeta «Acceso desde España» con fechaDato 2026-11-13 (y, en Smart Cash, el alcance «Tabla de disponibilidad de Spiko (13/11/2026)…»), sin cambiar el valor
- randhartingergasse-9-viena, apartamento-vacacional-hinterstoder-50, vivienda-pottendorfer-stra-e-62-wr-neustadt, fotovoltaica-greenpoint y fotovoltaica-cohotel: A20 · citas del KID («Custodia» y «Qué se adquiere») fuera de las seis fichas de auditoria/brickwise-a.md: solo Pottendorfer, GreenPoint y Cohotel, que se quedan como estaban
- kraken-xstocks: A6 · descripción «más de 130 acciones» → «más de 1.000 acciones y ETF de EE. UU.»
- radar (30 fichas): Correcciones del radar de auditoria/radar-plataformas.md (14 obligatorias y 6 recomendadas), salvo A23, A24 y A25
- randhartingergasse-9-viena y apartamento-vacacional-hinterstoder-50: A21 · tarjeta «Acceso desde España» → «Sin confirmar: cuenta para residentes del EEE (España incluida); esta emisión pide número fiscal austriaco.» (el aviso nuevo de A21 sí entra)
- mtbill: A22 · quitar https://midas.app/assets/main-DOxid0Zj.js (da 404) de la lista «fuentes» de la ficha (documentacion-ofertas.json)
- radar: midas: A24 · que el acceso, la licencia y el aviso «terminos_finales_no_confirmados» de Midas citen como fuente el PDF de las Condiciones Finales de mTBILL del CDN de GitBook
