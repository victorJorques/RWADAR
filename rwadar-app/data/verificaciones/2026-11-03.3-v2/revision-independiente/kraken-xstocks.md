# Revisión independiente · kraken-xstocks · 3 de noviembre de 2026

Revisor: Claude. No participé en la investigación. Revisé la propuesta
`admitir_propuesta` (colección principales) del expediente
`../expedientes/kraken-xstocks.json` (grupo `candidatas-casi-listas`).

Método: abrí yo mismo las fuentes primarias entre las 10:33 y las 10:44 UTC.
Solo leí páginas y documentos públicos. No inicié sesión, no hice KYC, no
rellené formularios ni conecté wallets. `backed.fi` sigue bloqueada por país
y no intenté saltarme el bloqueo. No he editado el expediente.

Copias de lo leído: `fuentes/kraken-xstocks/`. Las condiciones finales (llevan
direcciones de contrato), las respuestas de ESMA y dos HTML con direcciones
están en `fuentes/crudo/kraken-xstocks/`. El inventario, con hora, código
HTTP, bytes y SHA-256 de cada consulta, está en
`fuentes/kraken-xstocks/inventario-consultas.json`.

---

## Veredicto: **rechazado** (en este ciclo; se puede volver a proponer)

En pocas palabras: casi todo lo que dice el expediente es cierto y lo he
visto hoy. Pero **falla el punto decisivo**. Los documentos del emisor no
dicen que haya una oferta pública a particulares **en España**:

1. **Las condiciones finales solo ofrecen el producto en Liechtenstein y
   Suiza.** Las de SPYx y AAPLx (08/05/2026) y las más recientes que he
   encontrado (12/10/2026, posteriores al SUPP-68) dicen lo mismo:
   «The Products will be offered in Liechtenstein and Switzerland (only to
   Swiss Professional Investors)». El propio folleto dice que una oferta
   pública en un Estado del EEE solo vale si **las condiciones finales la
   especifican para ese Estado**. Ninguna la especifica para España. Además,
   las condiciones finales solo nombran como participante autorizado a
   **Kraken Bermudas**, no a la entidad chipriota que vende en España.
2. **No está demostrado que el canal de los documentos sea oficial.** Ninguna
   página oficial enlaza los ficheros «BF» de
   `sppdownloaddocumentservice.l-p-a.com`. Kraken lo usa, pero solo para sus
   **propios** KID de derivados. Para los certificados xStocks, Kraken, xStocks
   y el propio KID remiten a la web del emisor, que está bloqueada.

El encargo dice que, si esto no queda claro, la candidata no se admite. Hay
señales a favor: el folleto está pasaportado a España, la CNMV recibió las
condiciones finales, hay KID y resumen en español y la entidad de Kraken tiene
pasaporte. Pero esas señales no sustituyen al campo que el folleto declara
decisivo, y ese campo excluye a España.

---

## 1. El punto decisivo: ¿oferta pública en España cubierta por el folleto?

| Pregunta | Respuesta con documento | Fuente y hora UTC |
|---|---|---|
| ¿Folleto base pasaportado a España? | **Sí.** BPWO-80, aprobado por la FMA de Liechtenstein el 08/05/2026 y notificado a la CNMV el 11/05/2026. | CNMV, pasaportes recibidos, 10:38:07 · ESMA, 10:35:06 |
| ¿Suplementos pasaportados a España? | **Sí.** SUPP-62 (04/08/2026) y SUPP-68 (29/09/2026), los dos con «SPAIN» en `member_states`. | ESMA, 10:35:06 |
| ¿Condiciones finales comunicadas a España? | **Sí, se comunicaron**: FTWS-874 (SPYx, 20/05/2026), FTWS-966 (AAPLx, 20/05/2026) y FTWS-864 (NVDAx, 20/05/2026), con «SPAIN» en `member_states` e idioma «Spanish». Las 1.482 condiciones finales registradas bajo este folleto se comunicaron también a España. | ESMA, 10:35:06–10:36:34 |
| ¿Qué países de oferta fijan las condiciones finales? | **Solo Liechtenstein y Suiza (en Suiza, solo profesionales).** «The right to offer in other jurisdictions is explicitly reserved.» Aparte, otro campo lista los países donde «se ha notificado el folleto», España incluida. | Condiciones finales SPYx, p. 35, 10:34:14 · AAPLx, p. 33, 10:34:19 · G24x (12/10/2026), p. 33, 10:43:28 |
| ¿Qué regla aplica el folleto? | La oferta pública no exenta en un Estado del EEE solo es válida «if the Final Terms in relation to the securities specifies that an offer … may be made … in that Relevant Member State». Y añade: «Neither the Issuer nor any Authorised Participant has authorised … the making of any offer of Products in any other circumstances.» | Condiciones finales SPYx, parte A, p. 3 · Folleto, definición «Non-Exempt Offer», p. 18 |
| ¿Puede el emisor poner más países? | Sí. La plantilla del folleto deja ese campo abierto: «The Products will be offered in Liechtenstein [and Switzerland …]. [The right to offer in other jurisdictions is explicitly reserved.] [Specify as applicable.]». El emisor no ha añadido España. | Folleto, p. 141, 10:37:18 |
| ¿Es un descuido de 2026? | No. Las condiciones finales de 2024 que aloja la MFSA (bCSPX) dicen lo mismo. | MFSA, p. 35, 10:42:28 |
| ¿Quién es el participante autorizado en las condiciones finales? | Solo **Payward Digital Solutions Ltd (Kraken Bermudas)**. PEDSL-CY no aparece en ninguna de las tres condiciones finales que leí, ni siquiera en la de 12/10/2026. | SPYx, p. 33 · AAPLx · G24x, p. 31 |
| ¿Y el SUPP-68? | Nombra a PEDSL-CY participante autorizado del emisor (contrato del 04/05/2026), pero añade: «Details of the Authorized Participants appointed in respect of a Product will be set out in the relevant Final Terms.» Esas condiciones finales no la nombran. | SUPP-68, p. 2 y p. 6, 10:37:19 |
| ¿Quién es el oferente según el resumen en español? | «El Oferente es Backed Assets (JE) Limited». Y: «Los Inversores Minoristas pueden suscribir vía emisión solo a través de un Participante Autorizado». | Condiciones finales SPYx, resumen en español, sección 4, p. 65–66 |
| ¿Hay condiciones finales con España como país de oferta? | **No he encontrado ninguna.** En ESMA, SPYx, AAPLx y NVDAx solo tienen una versión vigente bajo BPWO-80 (la del 20/05/2026). La búsqueda web tampoco encontró ninguna. | ESMA, 10:35–10:36 · WebSearch, ≈10:41 |

**Conclusión del punto 2:** con los documentos públicos de hoy, la venta de
PEDSL-CY a particulares residentes en España **no queda cubierta de forma
expresa** por las condiciones finales. Es más: el texto que el folleto declara
decisivo la deja fuera. Que la CNMV recibiera las condiciones finales y que
haya KID en español indica que el emisor tiene esa intención, pero no cambia
lo que dice el documento. No sé si existe otra base legal para esa venta (por
ejemplo, que no se considere oferta pública); los documentos no la dan. No
está claro, así que la candidata no se admite.

---

## 2. ¿Es oficial el servicio `sppdownloaddocumentservice.l-p-a.com`?

| Hecho | Fuente y hora UTC |
|---|---|
| La página de KID de Kraken UE enlaza ese servicio, pero solo para sus **propios** KID («Kraken Key Information Document»): futuros, entre ellos los «Futuros perpetuos lineales vinculados a xStocks» (UPI `XSTOCK`). Es otro producto, un derivado apalancado. | https://eu.kraken.com/priips-kids · 10:33:22 · KID del perpetuo (es), 10:34:21 |
| Para los certificados xStocks, esa misma página dice: «Las Condiciones Finales y el Documento de Datos Fundamentales correspondiente a cada oferta individual de xStocks están disponibles en el sitio web del Emisor en https://assets.backed.fi/legal-documentation/product-database». | https://eu.kraken.com/priips-kids · 10:33:22 |
| xstocks.fi y docs.xstocks.fi remiten a `assets.backed.fi/legal-documentation`. Ninguna de las dos enlaza a `l-p-a.com`. | https://xstocks.fi/ y https://docs.xstocks.fi/docs/product-legal-overview · 10:33:22–23 |
| El propio KID en español dice: «El folleto y sus suplementos, las condiciones finales y las fichas de información están disponibles en el sitio web del emisor, en la siguiente dirección: https://www.backedassets.fi/legal-documentation». | KID SPYx, p. 3 · 10:34:16 |
| `assets.backed.fi/legal-documentation/product-database` redirige a `/geoblock` («Access Restricted … restricted country»). | 10:33:23 |
| Indicios a favor, que no son prueba: la copia `l-p-a` de SPYx es el «Product Nr. 71», con resúmenes en los mismos 18 idiomas que ESMA registra para FTWS-874. La versión anterior de ESMA se llama «367684_FTWS 71»; lo mismo pasa con AAPLx (n.º 18) y NVDAx (n.º 19). Los PDF dicen que los fabricó Backed Assets (JE) Limited. Los hashes de hoy coinciden con los del investigador. | ESMA, 10:35:06 · PDF, 10:34:14–10:34:19 |

**Conclusión:** el contenido parece auténtico, pero **ninguna página oficial
enlaza esos ficheros** para los xStocks. Así que no se cumple «que lo enlace
una página oficial». Lo que sí es oficial y lo comprobé: el folleto base, el
SUPP-68 y sus certificados, en la web de la MFSA (autoridad notificada), con
el mismo SHA-256 que leyó el investigador.

---

## 3. Hechos que comprobé (03/11/2026)

| # | Fuente (URL) | Hora UTC | Qué vi |
|---|---|---|---|
| 1 | https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/ | 10:39:25 | «Payward Europe Digital Solutions (CY) Limited (ex I.F. Greenfields Wealth Ltd)» · «Licence Number: 342/17» · «Licence Date: 13/11/2017» · registro 356603 · domicilio «Office 601, 237, 28th October Street, Limassol» · dominios aprobados: eu.kraken.com y ninjatrader.com/eu · servicios 1, 2 y 3 (incluida la negociación por cuenta propia) sobre los instrumentos 1 a 10 · custodia · servicios transfronterizos con **Spain**. |
| 2 | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=4474 (y `&vista=17`) | 10:39:36 / 10:39:37 | «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED · ESI del EEE en Libre Prestación · Nº Registro Oficial 4474 · 05/01/2018» · domicilio en Limasol · programa: recepción y transmisión, ejecución y «3. Negociación por cuenta propia · 1) Valores negociables», custodia y cambio de divisas ligado a servicios de inversión. |
| 3 | https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500001AB7C6C7F577 | 10:38:07 | «11/05/2026 · BACKED ASSETS (JE) LIMITED · LIECHTENSTEIN · BPWO-80 · 08/05/2026» · «Suplementos: Sí». **La columna «Traducción de la Nota de Síntesis» está vacía.** El expediente dice que tiene la traducción; no es así. La CNMV no lista condiciones finales y remite a ESMA. |
| 4 | https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500001AB7C6C7F577*&wt=json&rows=500&sort=approval_filing_date%20desc (y `start=500`, `1000`, `1500`) | 10:35:06–10:36:34 | 1.686 documentos. BPWO-80 se pasaportó el 11/05/2026; SUPP-62 y SUPP-68, a 29 Estados, España incluida. Hay 1.482 condiciones finales bajo BPWO-80, todas comunicadas también a España. Las de SPYx, AAPLx y NVDAx son FTWS-874, FTWS-966 y FTWS-864 (20/05/2026). La última se depositó el 15/10/2026. El registro solo da metadatos: no recoge el campo «países de oferta». Las búsquedas por ISIN con comodín dieron 504. |
| 5 | https://www.mfsa.mt/wp-content/uploads/2026/05/Backed-Assets-JE-Limited-Base-Prospectus-Document-dated-08-May-2026.pdf (SHA-256 47be9272…) | 10:37:18 | 160 páginas. La FMA notificó el folleto a 29 Estados, España incluida (p. 2) · «Principal Markets … mainly in Liechtenstein and for the EU in … Spain» (p. 57) · grupo Payward: el emisor es 100 % de Backed Finance AG, que es 100 % de Payward Europe Limited, que es 100 % de Payward, Inc. (p. 57) · «Authorized Participants may offer the Products to all segments of Investors» (p. 67) · plantilla de países de oferta (p. 141) · aviso de Jersey: solo adecuado para quien tenga «a significantly substantial asset base such as would enable them to sustain any loss» y sea «sufficiently financially sophisticated» (p. 4–5). |
| 6 | https://www.mfsa.mt/wp-content/uploads/2026/05/Backed-Assets-JE-Limited-Certificate-of-Approval-of-a-Base-Prospectus-dated-08-May-2026.pdf (SHA-256 be143057…) | 10:37:19 | Certificado de aprobación del BPWO-80 (FMA-LI, 08/05/2026). La CNMV figura entre los destinatarios. |
| 7 | https://www.mfsa.mt/wp-content/uploads/2026/10/Backed-Assets-JE-Limited-Second-Supplement-Document-dated-29-September-2026.pdf (SHA-256 acb0376b…) y su certificado (01124e94…) | 10:37:19 | 14 páginas. «Currently, the Issuer has Authorized Participant Agreements with Payward Digital Solutions Ltd and Payward Europe Digital Solutions (CY) Limited, both group companies of the Issuer» (p. 2) · riesgo nuevo «2.3.2.8 Financial dependency on Payward Group companies»: «Neither Payward nor PEL has guaranteed the Issuer's obligations under the Products» (p. 4) · el emisor **garantiza un préstamo** de PEL a su matriz (p. 6) · PEDSL-CY en «Athalassas 62 … Nicosia» (p. 6). |
| 8 | https://sppdownloaddocumentservice.l-p-a.com/api/DownloadDocument/UPI/CH1436219716/BF%20Final%20Terms%20AND%20Summary%20(PDF) (SHA-256 280159d4…) | 10:34:14 | Condiciones finales de SPYx, «Product Nr. 71», del 08/05/2026, 164 páginas. Países de oferta: Liechtenstein y Suiza (p. 35). Mínimo de suscripción directa con el emisor: 5.000 USD (p. 5). Comisión de suscripción o reembolso directo: hasta el 0,5 %, «but at least USD 100» (p. 5–6). Dividendos: «included, net of taxes … by way of Rebasing» (p. 7). Oferente: el emisor, solo a «Qualified Professional Investors» (p. 6). Participante autorizado: solo Kraken Bermudas (p. 33). Resumen en español: «El Emisor no es actualmente rentable y depende del capital y la financiación de la Sociedad Matriz» (p. 63). |
| 9 | …/UPI/CH1436219187/BF%20Final%20Terms%20AND%20Summary%20(PDF) (AAPLx) | 10:34:19 | Mismo texto: «Product Nr. 18», del 08/05/2026. Países de oferta: Liechtenstein y Suiza (p. 33). Solo Kraken Bermudas. |
| 10 | …/UPI/CH1588666003/BF%20Final%20Terms%20AND%20Summary%20(PDF) (G24x, la más reciente en ESMA) | 10:43:28 | Del 12/10/2026, posterior al SUPP-68. Países de oferta: Liechtenstein y Suiza (p. 33). Participante autorizado: solo Kraken Bermudas (p. 31). |
| 11 | …/UPI/CH1436219716/%5Bes%5D%20BF%20Key%20Information%20Document%20(PDF) (SPYx) | 10:34:16 | KID en español «con fecha 02 nov. 2026», 3 páginas (el expediente dice 4). Riesgo **5/7** · periodo recomendado 5 años · «producto que no es sencillo y que puede ser difícil de comprender» · el emisor «no está regulado por una autoridad competente de la UE» · entrada y salida «hasta el 0,50 %» · gestión: 0 % hoy, hasta el 0,25 % en el futuro · 0,09 %/año del ETF · incidencia anual de costes 0,2761 % · «Los intermediarios … pueden aplicar comisiones o cargos adicionales» · reembolso ante el emisor «en cualquier momento» · nombra a Kraken Bermudas, no a PEDSL-CY. |
| 12 | …/UPI/CH1436219187/%5Bes%5D… (AAPLx) · …/UPI/CH1436219195/%5Bes%5D… (NVDAx) | 10:34:17 / 10:34:18 | AAPLx: riesgo **5/7**, incidencia anual 0,1977 %. NVDAx: riesgo **6/7**, incidencia anual 0,1803 %. Los dos con fecha 02/11/2026. |
| 13 | https://eu.kraken.com/xstocks | 10:33:22 | «Acciones tokenizadas. Opera 24/5.» · «más de 130 empresas» · «disponibles para clientes de PEDSL-CY ubicados en la UE que hayan completado con éxito la evaluación de idoneidad obligatoria o que sean inversores profesionales» · «tan solo 1 EUR» · con USD no hay comisión; con otros activos, «compra instantánea estándar» más spread · venta «a USD al precio de mercado actual» o retirada a monedero · «24/5, con acceso 24/7 para determinados activos en Kraken Pro» · pie: «**El emisor de xStocks no está afiliado al Grupo Kraken**» · llama al emisor «un tercero (Backed Assets Financials (JE))» · PEDSL-CY en Nicosia. |
| 14 | https://eu.kraken.com/legal/risk-disclosure | 10:38:52 | «Updated : 27 January 2026» · «xStocks are debt securities in tokenised format» · «PEDSL provides buy and sell services in relation to xStocks acting as principal» · «no voting rights, dividend or distribution entitlements» · riesgo de PEDSL «as the dealer and initial custodian» y de Backed · «complex products» · «YOU CAN LOSE YOUR ENTIRE INVESTMENT». |
| 15 | https://eu.kraken.com/help/fees (redirige a https://www.kraken.com/features/fee-schedule) | 10:41:16 | «comisión de trading del 1% a las operaciones instantáneas y recurrentes» · el precio «incluye un spread» que «puede variar» · xStocks: sin comisión con USDG o USD; con otros activos, la de compra instantánea estándar · en Kraken Pro, comisiones maker/taker (taker desde el 0,080 %). Es la tabla global de Kraken, no una propia del EEE. |
| 16 | https://support.kraken.com/articles/xstocks-availability | 10:41:16 | Última actualización: 18/06/2026. No disponible en EE. UU., Australia, Canadá, **Bélgica** (solo en una de las dos listas), Reino Unido y regiones prohibidas · EEE: cuestionario previo y «solo fiat» · dice que los xStocks se ofrecen a través de PDSL (Bermudas). |
| 17 | https://support.kraken.com/articles/xstocks-faq | 10:41:17 | Última actualización: 30/10/2026 · mínimo «desde tan solo 1 USD» (la página de la UE dice 1 EUR) · conversión entre xStocks: 1 % fijo · rebasing: «Dividendo neto (tras la retención fiscal del 30% en EE. UU.)» · 10 xStocks se negocian 24/7 en Kraken Pro. |
| 18 | https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=… (Kraken, Payward, Payward%20Europe, Backed, Backed%20Assets, xStocks, Greenfields, PEDSL) | 10:40:32–10:41:08 | Siempre «No hay datos disponibles» («por tipo No autorizadas»). Control: «Gemini» devuelve GEMINI LTD FX y GEMINI OPTION LTD (10:40:42), así que la búsqueda funciona. |

### Contraste con el expediente

- **Coincide** y lo confirmo: entidad, licencia y pasaporte de PEDSL-CY;
  inscripción en la CNMV n.º 4474; folleto y suplementos pasaportados; riesgo
  KID 5/7 y 6/7; costes del emisor; reembolso; dividendos por rebasing;
  mínimo de 1 €; comisión del 1 % más diferencial con euros; salida por venta
  o retirada; ninguna advertencia de la CNMV. Los SHA-256 de los PDF coinciden
  con los del investigador.
- **Afiliación (la pidió la revisión del 02/11): comprobada.** Backed
  pertenece al grupo Payward (Kraken): folleto, p. 57; resumen en español de
  las condiciones finales; SUPP-68, «group companies of the Issuer». La web
  de Kraken UE dice «no afiliado». Manda el folleto.
- **Corrijo:**
  - La CNMV **no** marca la traducción de la nota de síntesis (la columna
    está vacía).
  - Los países de oferta de las condiciones finales **sí son un bloqueo**, no
    «una discrepancia, no un bloqueo», como dice el resumen del investigador.
  - PEDSL-CY no figura como participante autorizado en ninguna de las
    condiciones finales leídas.
  - «Servicio documental que usa el propio emisor»: no acreditado.
  - `documentacionClara: "si"` debería ser `"parcial"`.
  - Páginas: los KID tienen 3, no 4; las condiciones finales de SPYx, 164, no
    165; el folleto, 160, no 161.
- **Datos nuevos que el expediente no recoge:**
  - El emisor no es rentable, depende de la financiación del grupo y avala un
    préstamo de su matriz (SUPP-68, p. 4 y 6).
  - El aviso de Jersey del folleto: solo es adecuado para quien pueda soportar
    cualquier pérdida y tenga conocimientos financieros (p. 4–5).
  - Retención del 30 % en EE. UU. sobre los dividendos (FAQ de Kraken).
  - El KID pone el coste de entrada en 50 USD sobre 10.000 USD (0,50 %), pero
    las condiciones finales fijan un mínimo de 100 USD para la suscripción o
    el reembolso directo. Afecta a quien trata directamente con el emisor, no
    al cliente de Kraken.

---

## 4. Lo que no pude comprobar

- **Canal oficial de los KID y las condiciones finales.** `assets.backed.fi`
  y `www.backedassets.fi` están bloqueadas por país; no intenté saltarme el
  bloqueo. Ninguna página oficial enlaza los ficheros «BF» de `l-p-a.com`.
- **Si las copias de `l-p-a.com` son idénticas a las depositadas en la FMA**
  (FTWS-874, 966 y 864). ESMA solo publica metadatos y no encontré el
  documento depositado.
- **Si alguna de las 1.482 condiciones finales pone España como país de
  oferta.** Leí 4: tres de 2026 y una de 2024. Las cuatro dicen Liechtenstein
  y Suiza. ESMA no recoge ese campo.
- **La base legal con la que Kraken vende a minoristas en España** (si la
  considera oferta pública, reventa o algo exento). No hay ningún documento
  público que lo explique.
- **La lista de advertencias de reguladores extranjeros de la CNMV.** Solo se
  consulta enviando el formulario (la URL directa con `tipo=2` da 400) y no lo
  hice. Sí consulté las advertencias propias de la CNMV.
- **El test de Kraken.** La web dice «idoneidad» y la divulgación de riesgos
  dice «appropriateness». Para verlo hay que iniciar sesión.
- **El diferencial de Kraken** (no se publica) y **si Kraken Pro, con
  comisiones maker/taker, está abierto a clientes del EEE** para los xStocks.
- **El domicilio de PEDSL-CY:** Limasol según la CySEC y la CNMV; Nicosia
  según Kraken y el SUPP-68. No lo puedo resolver.
- **La noticia de SPCXx (junio de 2026):** no la revisé. El expediente no la
  usa.

---

## 5. Qué haría falta para volver a proponerla

1. **Unas condiciones finales con España en «Country(ies) of offer»** y con
   PEDSL-CY como participante autorizado, depositadas en la FMA y comunicadas
   a la CNMV (con fecha visible en ESMA). La alternativa es un documento
   oficial del emisor o de la CNMV que explique en qué se basa la venta a
   particulares en España. Una página comercial de Kraken no basta.
2. **Obtener los documentos por un canal oficial.** Por ejemplo, que Víctor
   descargue desde España, en `www.backedassets.fi/legal-documentation`, las
   condiciones finales y el KID de SPYx y AAPLx y los deje en `fuentes/`.
   Después se compara su SHA-256 con el de las copias de `l-p-a.com`.
3. Si se cumplen 1 y 2, aplicar los cambios de la tarjeta del apartado 6.

---

## 6. Cambios obligatorios en la tarjeta (si se vuelve a proponer)

Mientras no se resuelva el apartado 5, la tarjeta **no se publica** con
ningún texto. Si se resuelve, estos son los cambios, con el texto exacto:

**Título** (cambio pequeño: «replican» suena a copia exacta):
> xStocks: certificados tokenizados que siguen el precio de acciones de EE. UU.

**Resumen:**
> Certificados de deuda de Backed Assets (JE), sociedad de Jersey del grupo
> de Kraken, que siguen el precio de más de 130 acciones y ETF de EE. UU. No
> son las acciones: dependen de la solvencia del emisor. Los vende Kraken UE
> desde Chipre.

**resumenTarjeta:**
- `minimo`: «Desde 1 € en Kraken UE (compras fracciones del certificado)»
- `accesoEspana`: «Sí, en Kraken UE tras aprobar su cuestionario; en el EEE
  solo pagas con dinero fiduciario» (solo si se cumple el punto 1 del
  apartado 5; si no, no se publica)
- `salida`: «Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token
  a tu wallet. Sin plazo fijo.»

**Métricas** (sustituyen a las propuestas):
| Etiqueta | Valor |
|---|---|
| Mínimo | Desde 1 € |
| Qué compras | Certificado de deuda de Backed Assets (JE), no la acción |
| Vendedor y supervisor | Payward Europe Digital Solutions (CY) · CySEC 342/17 · CNMV n.º 4474 |
| Folleto | Aprobado por la FMA de Liechtenstein y notificado a la CNMV (11/05/2026) |
| Condiciones finales | España como país de oferta, con su fecha (solo cuando exista; hoy no) |
| Riesgo KID | 5 de 7 (AAPLx, SPYx) · 6 de 7 (NVDAx) · KID 02/11/2026; varía por xStock |
| Compra con euros | 1 % de compra instantánea más un diferencial que Kraken no publica |
| Costes del emisor (KID) | Entrada y salida hasta 0,50 %; sin comisión de gestión hoy (máx. 0,25 %/año) |
| Salida | Venta a Kraken en USD (24/5) o retirada a wallet |
| Plazo recomendado (KID) | 5 años |

**Avisos** (sustituyen a los propuestos):
1. «No compras la acción: es un certificado de deuda de Backed Assets (JE),
   sin voto ni dividendos en efectivo.»
2. «Riesgo de contraparte: si el emisor o Kraken fallan, puedes perder parte o
   todo. El emisor no es rentable y depende de su grupo.»
3. «Emisor y vendedor son del mismo grupo (Payward/Kraken), aunque la web de
   Kraken diga "no afiliado".»
4. «Producto complejo, según su KID: puedes perder toda la inversión.»
5. «El folleto advierte que solo es adecuado para quien pueda soportar
   cualquier pérdida y tenga conocimientos financieros.»
6. «Precio y venta en USD: si el dólar baja frente al euro, pierdes aunque la
   acción no se mueva.»
7. «Los dividendos no se cobran: se suman al saldo, netos de una retención del
   30 % en EE. UU.»

**Pasos:** se mantienen («Abres cuenta y test», «Compras con euros»,
«Vendes o retiras»).

**Lugar:** se mantiene «Limasol · Chipre», que es el domicilio que dan la
CySEC y la CNMV.

**Concepto:** aceptable. Cambio recomendado, no obligatorio, para que se vea
que es un certificado:
> un certificado que se transforma en ficha digital, con la silueta lejana de
> rascacielos financieros y una cartera de mano

**fuentesActuales:** quitar los enlaces a `l-p-a.com` hasta que una página
oficial los enlace. Poner en su lugar el canal oficial del emisor y el
registro de ESMA.

**prioridadEditorial:** `compraDesdeEspanaComoParticular: "no_confirmado"` y
`documentacionClara: "parcial"`. En `porQueNo`: «Las condiciones finales solo
ofrecen el producto en Liechtenstein y Suiza; el canal de los KID no está
enlazado por ninguna página oficial.»
