# Revisión independiente · candidata `candidata-ondo-global-markets-stocks` (Ondo Stocks) · 20/11/2026

Revisor independiente: no hice el análisis. Repetí las consultas a la fuente
primaria por mi cuenta entre las 21:25:41Z y las 21:32:26Z del 20/11/2026.

- Crudos (fuera de Git): `grupos/busqueda-nueva/fuentes/crudo/revision-ondo-stocks/`.
  Ahí están `consultas.log` y `enlaces.log` (hora, código, tamaño y SHA-256) y
  `prueba-tarjeta.cjs`.
- Extracto en texto: `grupos/busqueda-nueva/fuentes/revision-ondo-stocks/ondo-stocks-revision-2026-11-20.txt`.

## Veredicto

**Confirmado con cambios.** La decisión `no_admitir` se sostiene, y con más
pruebas que las del analista. Las piezas esenciales que él da por buenas
(folleto, pasaporte, oferta continua, KID en español, sin advertencias) las he
comprobado una a una con mis consultas de hoy y coinciden. La pieza que falla
también se confirma: **no se puede afirmar que un particular residente en
España pueda comprar**. Además, la oferta es de calidad baja para un particular
(punto 4). Aunque mañana se resolviera lo del acceso, no la admitiría.

Los cambios que pido en el expediente **no cambian la decisión**, pero corrigen
dos razones del motivo que hoy están mal planteadas y añaden tres pruebas
nuevas:

1. **Mínimo: no hay «tres cifras en conflicto».** El mínimo práctico es 1 USD.
   Lo dicen la documentación («The minimum is just $1.00 USD») y la página del
   token (https://app.ondo.finance/assets/aaplon, 21:29:24Z: «Minimum Amount |
   $1»). Los 0,01 USDC de las condiciones finales son el suelo legal de la
   suscripción, y el «up to USD 0.01» es la plantilla del folleto base. No se
   contradicen. Pedimos:
   - pasar el claim `minimo` a `respaldado_con_alcance`, con el texto «1 USD
     (pagado en USDC) en la plataforma del emisor; 0,01 USDC es el mínimo legal
     de las condiciones finales»;
   - quitar del motivo y de `bloqueos` lo de las «tres cifras distintas».

   El problema real del mínimo es otro: está en dólares y solo se puede pagar
   con USDC desde una cartera propia («Purchasing Ondo tokenized stocks
   directly via bank wire is not currently supported»).
2. **«Ninguna entidad regulada en España lo vende»: no es un requisito legal ni
   un motivo de rechazo por sí solo.** Con un folleto pasaportado, la ley
   española no obliga a que intervenga un intermediario. El art. 36 de la Ley
   6/2023 solo lo exige en colocaciones «no sujetas a la obligación de publicar
   folleto» (BOE, 21:29:01Z). Además, el catálogo publica mTBILL, que también
   vende directamente su emisor sin licencia (expediente `mtbill`,
   `entidadYPermisos: cumple_con_limites`). Hay que dejarlo en el expediente
   como **dato de calidad** (no hay ningún intermediario que valore si el
   producto te conviene, ni un servicio de atención al cliente en España), no
   como motivo esencial.
3. **Prueba nueva a favor del «solo profesionales»: las «Sales Terms» del
   emisor.** La página de documentos del emisor las marca como vigentes
   («status: current», asOfDate 2026-01-16). Su documento
   (https://cdn.sanity.io/files/8k2tqa6n/production/f22c30e6d14a8000abc4e1ad6f62d6cb41dc3da0.pdf,
   21:27:14Z, SHA-256 `b1111538…6194`, de fecha 17/07/2025) dice en la p. 6:
   «in the EU and the EEA to qualified investors as defined in the Prospectus
   Regulation». La propia documentación dice que esas condiciones rigen los
   derechos del inversor: «Tokenholder rights and obligations are governed by
   Swiss law under the Issuer's Sales Terms» (Legal & Regulatory, 21:26:09Z).
   Ya son **dos documentos del emisor contra el folleto**: la página de
   requisitos y las Sales Terms. Pedimos añadir un claim `accesoEspana` con
   este literal, en estado `en_conflicto`.
4. **Prueba nueva de solidez: el emisor tiene patrimonio negativo y pierde
   dinero.** Folleto, p. 18: «As at June 30, 2026, the shareholders’ deficit
   amounted to USD 3,119,568 (unaudited). The Issuer’s liabilities therefore
   exceed its assets. If its shareholders and Affiliates cease to provide
   financial support, the Issuer may be unable to continue as a going concern».
   Al 31/12/2025, el déficit era de 1.262.231 USD. La sociedad se constituyó el
   09/04/2025. Pedimos añadirlo a `riesgos` y a `porQueNo`.
5. **Prueba nueva sobre costes: hay un diferencial que no aparece en el KID.**
   La documentación dice que el precio de cotización puede diferir del de
   compra del emisor «with any difference being retained by Ondo Stocks», y que
   el diferencial se fija con «quote size, target profit, and several other
   proprietary considerations» (Token & Quote Pricing, 21:27:46Z). El KID dice
   «Actualmente, no se cobran comisiones» y «Los inversores no asumirán ningún
   otro coste que los expresamente revelados». Hay que ampliar el claim
   `comisiones` con esto.
6. **El KID está desfasado en un punto más.** Dice que AAPLon no está admitido
   en ningún SMN «tanto dentro como fuera de la Unión Europea». Pero la página
   de documentos del emisor tiene, para AAPLon, un «Admission to Trading Notice
   on Binance MTF in Abu Dhabi Global Market». Añadirlo a `bloqueos` o al
   claim `documentos`.
7. **Copia del folleto en la web del emisor: es otro archivo.**
   `documentos[0].nota` dice «Mismo documento». El texto es idéntico: mismo
   sobre «Docusign 11DACC73…», y la comparación de textos no da ninguna
   diferencia. Pero el PDF del emisor
   (https://cdn.sanity.io/files/8k2tqa6n/production/49482dccf9f491b39f367098ce26de37b61fcdd9.pdf)
   es otro archivo: SHA-256 `3763635b…4367`, 8.904.277 B, modificado el
   10/11/2026. Hay que anotarlo así.
8. **Texto interno de salida (`resumenTarjeta.salida`).** Ahora dice
   «Reembolso al emisor en cualquier momento, con su KYC, o venta a terceros
   fuera de mercado (KID, 11/11/2025).» Tiene dos problemas:
   - «KYC» no es castellano llano;
   - «en cualquier momento» suena a promesa, cuando el emisor «may refuse any
     redemption» (Secondary Market Restrictions).

   Cambiarlo por: «Reembolso al emisor en USDC, previa verificación de
   identidad, o venta a terceros fuera de mercado (KID, 11/11/2025)» (116
   caracteres; probado con `resumenOferta`).
9. **`enlacesProbados`: la fila de https://www.assetera.com/fees (404).** Es
   una dirección que se probó a mano, no un enlace de la web de Assetera. Hay
   que añadirle esta nota: «dirección probada, no enlazada por Assetera; prueba
   de que no hay página de tarifas». Así nadie la usará como fuente.

Motivo propuesto, en llano (sustituye al actual):

> No se admite. El folleto nuevo (BPWO-89, aprobado por la FMA de Liechtenstein
> el 11/11/2026) está pasaportado a España, y hay KID en español. Pero el emisor
> se contradice sobre a quién vende: el folleto y las condiciones finales hablan
> de particulares de España, mientras que su página de requisitos y sus
> condiciones de venta («Sales Terms», marcadas como vigentes) limitan el EEE a
> clientes profesionales o inversores cualificados. Comprobarlo exige darse de
> alta, y eso está fuera de nuestros límites. Además, la oferta es mala para un
> particular. El emisor es una sociedad de las Islas Vírgenes Británicas sin
> supervisión y con patrimonio negativo (−3,1 millones de USD a 30/06/2026). Se
> paga solo con USDC desde una cartera propia, sin transferencia bancaria. El
> diferencial que se queda el emisor no figura en el KID. Y no hay intermediario
> regulado en España. Sin advertencias de la CNMV.

---

## 1. Lo esencial, con mis consultas de hoy

### Entidad y registro

- **ESMA, folletos por LEI** (21:25:41Z, HTTP 200, 6.016 B):
  https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?q=party_name:*984500Z0Q6A5E8BE2B61*%20AND%20-document_type:FTWS&wt=json&rows=50&sort=approval_filing_date%20desc
  - `numFound` 4. BPWO-89: `approval_filing_date` 2026-11-11, origen
    LIECHTENSTEIN, `first_passporting_date` 2026-11-11T15:13:27Z, en inglés.
  - `member_states` tiene **29** Estados, SPAIN incluido.
  - Los otros tres: los suplementos del 28/08/2026 y del 05/05/2026, y el
    BPWO-68 (11/11/2025).
  - **Coincide** con el analista.
- **Folleto base** (MFSA, 21:26:32Z, HTTP 200, 200 pp, SHA-256 `7f323e24…68bf`,
  el mismo que el analista):
  https://www.mfsa.mt/wp-content/uploads/2026/11/Ondo-Global-Markets-BVI-Limited-Base-Prospectus-Document-dated-11-November-2026.pdf
  - p. 1: «The validity of this Base Prospectus will expire on 11.11.2027».
  - p. 2: «approved by the FMA on 11.11.2026».
  - p. 4: «will operate without supervision by any authority in any jurisdiction».
- **Supervisor del emisor:** ninguno. Lo aprobado es el folleto, no el emisor.
  Confirmado.
- **Custodio de las acciones:** «Alpaca Securities LLC ... registered with the
  U.S. Securities and Exchange Commission», y también BitGo Trust Company
  (folleto, p. 43). Agente de garantías y de verificación: Ankura Trust Company
  (documentación «Trust & Transparency», 21:27:51Z).

### Oferta abierta hoy

- **Condiciones finales de NFLXon** (MFSA, 21:26:33Z, SHA-256 `390d4aba…b19d`),
  pp. 1-2: «An offer of the Products may be made by the Issuer ... on an
  ongoing basis on every calendar day ("Offer Period") through the website of
  the Issuer».
- **Condiciones finales vigentes de AAPLon** en la web del emisor (21:27:14Z,
  SHA-256 `8b307e13…d889`). Llevan el aviso de continuidad: «The offer of the
  Products to the public will continue on the basis of the Successor Base
  Prospectus ... in accordance with Article 8(11)». Es decir, las condiciones
  finales antiguas siguen valiendo con el folleto nuevo.
- **ESMA, condiciones finales** (21:25:42Z): 276 en total.
  - 274 son del folleto anterior y 2 del BPWO-89: FTWS-2876 (VGG7001APH19) y
    FTWS-2877 (VGG7001APJ74), del 13/11/2026, con SPAIN y nota de síntesis en
    español.
  - Ninguna de las 276 deja fuera a España.
  - Los dos ISIN nuevos no salen en la página de documentos del emisor. Sigo sin
    saber a qué token corresponden, como el analista.
- **Conclusión:** la oferta está viva y es continua, para quien supere el alta
  del emisor. **Coincide.**

### Acceso desde España como particular: no confirmado (se confirma el conflicto)

A favor de que vende a particulares:

- Folleto, p. 95, cláusula XXXIII: «to retail or professional investors within
  the EU and the EEA ... Spain».
- Condiciones finales de NFLXon (p. 6) y de AAPLon: «to both retail and
  professional investors within the EU and the EEA».
- Important Notes (21:26:07Z): «making many Ondo Stocks available to both
  professional and retail investors, though certain Ondo Stocks are only
  available to professional investors in the EEA/EU». No dice cuáles.
- Onboarding & KYC: «open to ... retail users/individuals in supported
  jurisdictions».

En contra:

- Eligibility (21:26:07Z, SHA-256 `5c21e9c9…7adbdf`, el mismo que el analista).
  La versión HTML (21:30:43Z) dice lo mismo: «Any Member State of the European
  Economic Area | "Professional Client" under MiFID II ... or "Qualified
  Investor"» ... «in order to be issued Ondo Stocks».
- **Nuevo:** las Sales Terms, «current» en la página de documentos, p. 6: «in
  the EU and the EEA to qualified investors as defined in the Prospectus
  Regulation». La documentación dice que los derechos del inversor se rigen por
  ellas.

Un matiz que conviene anotar: el folleto remite a la página de requisitos solo
para los países **prohibidos** («prohibited jurisdictions as described in the
Issuer's eligibility criteria»). España está en la tabla de **restringidos**,
no en la de prohibidos. Por eso el folleto, leído solo, permitiría vender a
particulares en España. Pero el emisor publica dos documentos vigentes que
dicen lo contrario y no aclara cuál manda. Resolverlo exige darse de alta (KYC),
que está fuera de límites. **El motivo central del analista se sostiene.**

### Mínimo

1 USD, pagado en USDC (ver el cambio 1). Para comprar hay que tener USDC en una
cartera propia. La transferencia bancaria solo se admite para comprar USDon y
desde 500.000 USD.

### Salida

- KID en español de AAPLon, apartado 5: «Usted puede, en cualquier momento,
  presentar una solicitud de reembolso al Emisor ... podrá vender el Producto
  en operaciones extrabursátiles ("OTC")».
- Documentación: el reembolso a USDon es inmediato. El de USDC, «instant
  provided there is enough liquidity in the stablecoin swapper». Y «Redemptions
  to USD via bank wire are not currently supported».
- El emisor puede negarse: «the Issuer may refuse any redemption»
  (Secondary Market Restrictions).
- Puede reembolsar toda la emisión por motivos fiscales: «the Issuer may redeem
  all outstanding securities at any time, inter alia, for certain tax reasons»
  (NFLXon, p. 11).
- **Coincide** con el analista, con estos dos matices añadidos.

### Riesgos

- KID en español (ZIP SHA-256 `335f8c12…de90`; PDF «(ES)» `19a398f3…11f1`):
  «nivel 6 de 7» y «podría perder la totalidad del capital invertido».
- Folleto, p. 18: patrimonio negativo, pérdidas y riesgo de continuidad del
  emisor, con «Risk rating: high» (ver el cambio 4).
- Arbitraje en Zúrich, en inglés, «Subject to any mandatory rights of EEA retail
  investors» (folleto, p. 2).

### Documentos

- Folleto en inglés.
- Condiciones finales con nota de síntesis en español.
- KID por token: 272 de 493 tokens tienen condiciones finales y KID, y 220 no
  tienen ningún documento (lo conté en la página del emisor, 21:26:11Z).
- El KID de AAPLon en español es del 11/11/2025, de antes del folleto nuevo.
- Señales de poco cuidado en el KID en español:
  - el pie de cada página está en francés, «DOCUMENT D’INFORMATIONS CLÉS»;
  - en la ficha del subyacente queda un «and» en inglés;
  - dice que no cotiza en ningún SMN, cuando AAPLon tiene aviso de admisión en
    el SMN de Binance en Abu Dabi.
- La FAQ dice que los documentos de oferta solo se dan «to investors who
  successfully complete our onboarding process». Pero la página de documentos
  los publica sin sesión.
- Un suplemento del folleto anterior sigue marcado como «Current».

### Advertencias de la CNMV (tipo «No autorizadas», HTTP 200)

- «Ondo» (21:28:10Z): solo nombres ajenos que se parecen por el texto
  (BANKLONDONGROUP.UK, GESTIONFONDOENDOWMENT.FR, LONDONCAPITALFX.EU, LONDON
  CAPITAL GROUP LTD, LONDONEX.COM, CONDOR RESEARCH, LONDONBANK DIGITAL CREDIT).
- «Ondo Global Markets», «Ondo Finance» y «Ondo Stocks» (21:28:13Z–21:28:16Z):
  «No hay datos disponibles».
- **Sin advertencias. Coincide.**

### Pasaporte en la CNMV y posibles intermediarios

- CNMV, pasaportes (21:25:45Z, SHA-256 `1351fccf…01e5a4`, el mismo que el
  analista): «11/11/2026 Ondo Global Markets (BVI) Limited LIECHTENSTEIN
  BPWO-89 11/11/2026».
- CNMV, empresas de servicios de inversión del EEE (21:28:06Z): «ASSETERA GmbH
  ... 5216 - 26/10/2023». No figuran Blockchain, Bitget, Binance, Bybit, Alpaca
  ni Kraken.
- Assetera: su mercado no muestra la comisión («fee rate is not available
  yet»). Las páginas /fees, /pricing y /faq dan 404 (21:29:45Z). **Coincide.**

**Resultado de intentar tumbar cada pieza:** caen dos argumentos secundarios
(las «tres cifras» del mínimo y el intermediario como requisito), pero no cae
la pieza esencial, el acceso de un particular, que sale reforzada.

---

## 2. Enlaces

He probado las 19 URL del expediente y 9 más que cita por su nombre (otras
páginas de la documentación, sus versiones HTML, la ESMA de condiciones finales
y el KID de NFLXon). Usé GET y HEAD, siguiendo redirecciones, entre las
21:30:14Z y las 21:30:46Z. El registro está en `crudo/revision-ondo-stocks/enlaces.log`.

| # | URL | Código final · tamaño · tipo | Valoración |
|---|---|---|---|
| 1 | https://www.mfsa.mt/wp-content/uploads/2026/11/Ondo-Global-Markets-BVI-Limited-Base-Prospectus-Document-dated-11-November-2026.pdf | 200 · 8.891.281 B · PDF | Bien |
| 2 | https://www.mfsa.mt/wp-content/uploads/2026/05/Ondo-Global-Markets-BVI-Limited-Final-Terms-Document-dated-26-March-2026-REF-NFLXon.pdf | 200 · 1.312.233 B · PDF | Bien |
| 3 | https://cdn.sanity.io/files/8k2tqa6n/production/630a1e519b89411882c560d77da760c1216ea938.zip | 200 · 3.452.316 B · ZIP | Carga, pero es un ZIP de 23 lenguas: un visitante no ve el KID directamente. Si algún día se enlaza, avisar de que es un ZIP |
| 4 | https://app.ondo.finance/legal-documentation | 200 · 522.539 B · HTML | Bien, sin sesión. Los datos van en el HTML servido |
| 5 | https://docs.ondo.finance/ondo-stocks/eligibility.md | 200 · 9.153 B · markdown | Bien. Para un visitante es mejor la versión HTML (fila 23) |
| 6 | https://docs.ondo.finance/ondo-global-markets/eligibility | 200 · 188.229 B (1 redirección a /ondo-stocks/eligibility) | Bien. Es la que cita el folleto |
| 7 | https://docs.ondo.finance/ondo-stocks/important-notes.md | 200 · 9.269 B | Bien |
| 8 | ESMA `party_name:*984500Z0Q6A5E8BE2B61* AND -document_type:FTWS` | 200 · 6.014 B · JSON | Bien. Un visitante ve JSON en bruto |
| 9 | https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500Z0Q6A5E8BE2B61 | 200 · 215.735 B | Bien (sin cabecera de idioma) |
| 10 | https://www.cnmv.es/portal/Consultas/listadoentidad.aspx?id=1&tipoent=4 | 200 · 1.993.103 B (1 redirección) | Bien |
| 11–13 | CNMV advertencias: «Ondo», «Ondo Global Markets», «Ondo Finance» | 200 · 211–227 kB | Bien |
| 14 | https://docs.ondo.finance/ondo-stocks/investing-and-redeeming.md | 200 · 6.388 B | Bien |
| 15 | https://docs.ondo.finance/ondo-stocks/fees-and-taxes.md | 200 · 3.355 B | Bien |
| 16 | https://ondo.finance/global-markets | 200 · 3.925.829 B (1 redirección a /ondo-stocks) | Bien |
| 17 | https://ondo.finance/ondo-stocks | 200 · 3.925.339 B | Bien |
| 18 | https://www.cnmv.es/Portal/Consultas/listadoentidad?id=1&tipoent=4 | 200 · 1.993.103 B | Bien |
| 19 | https://www.assetera.com/fees | **404** · 48.354 B | No carga. Es una dirección que se probó a mano, no un enlace de Assetera: prueba que no hay página de tarifas. No es fallo del expediente si se anota así (cambio 9). No debe usarse como fuente |
| 20–22 | docs `onboarding-and-kyc.md`, `secondary-market-restrictions.md`, `legal-and-regulatory.md` | 200 · 4.886 / 7.972 / 4.843 B | Bien |
| 23–26 | Versiones HTML de eligibility, important-notes, investing-and-redeeming y fees-and-taxes | 200 · 171–188 kB | Bien |
| 27 | ESMA `document_type:FTWS` | 200 · 32.995 B | Bien |
| 28 | https://cdn.sanity.io/files/8k2tqa6n/production/b8de3e1d21654e65b43806a573bf003eb26caba5.pdf (KID de NFLXon) | 200 · 110.346 B · PDF | Bien |

En todas, GET y HEAD dan el mismo código. **No hay ningún enlace roto entre las
fuentes.** El único 404 es la prueba a mano de la fila 19. No hubo 403 de
antirrobots. Como `propuestaTarjeta` es `null`, no hay enlaces de tarjeta que
probar.

---

## 3. Presentación de la tarjeta y de la ficha

El expediente no trae `propuestaTarjeta`, lo cual es coherente con
`no_admitir`. Solo trae `resumenTarjeta` como nota interna. Aun así, construí
una oferta de prueba con la forma de las de
`2026-11-13-v2/escaparate-publicacion.json`, con estos datos:

- `coleccion: principales`, `verificadaEl: 2026-11-20`, `vigenciaDias: 7`;
- `disponibleEs: null`, porque el expediente dice «no_confirmado»;
- `documentacion.referencias` con las etiquetas fijas y los textos de
  `resumenTarjeta`;
- título de prueba: «Ondo Stocks: acciones y ETF de EE. UU. tokenizados».

Después ejecuté `resumenOferta` (`rwadar-site/assets/ficha-editorial-20261022.js`)
con la hora 2026-11-20T21:35Z. El script está en
`crudo/revision-ondo-stocks/prueba-tarjeta.cjs`.

Lo que se vería, tal cual:

| Caso | Tarjeta de la lista | «Lo esencial» de la ficha |
|---|---|---|
| A. Tal cual, con `estadoRevision: actual` | «Mínimo (EUR) No verificado · España Sin confirmar». Estado en verde: «Datos con fuente y fecha · consulta las condiciones» | Mínimo: «No documentado en euros» · España: «Sin comprobar si se puede contratar desde España» · Salida: «Reembolso al emisor en cualquier momento, con su KYC, o venta a terceros fuera de mercado (KID, 11/11/2025).» |
| B. Con `estadoRevision: fuentes_en_conflicto`, que es lo que dice el expediente | La misma línea, más el aviso rojo «Las fuentes no coinciden» | Mínimo: «Sin mínimo vigente en euros» · España: «Sin comprobar…» · Salida: «Salida no documentada» (la salida se oculta) |
| C. Con el mínimo «1 USD» del cambio 1 | «Mínimo 1 USD · España Sin confirmar» | Mínimo: «No documentado en euros (1 USD)» · España: «Sin comprobar…» |
| D. Si se diera por buena la venta a particulares (`disponibleEs: true`) | «Mínimo 1 USD · España Disponible» | España: «Disponible desde España según la fuente». **Sería engañoso hoy**: dos documentos del emisor lo niegan |

Comprobación de las normas de las tarjetas:

- **Castellano llano:** falla en la salida, por «KYC». Cambio 8.
- **≤ 120 caracteres:** la salida tiene 108 (bien; la propuesta, 116). El
  `resumenCorto` tiene **192**. Solo vale como nota interna; si alguna vez se
  usa como resumen, hay que acortarlo, por ejemplo: «Folleto pasaportado a
  España, pero el emisor se contradice sobre si vende a particulares del EEE.»
  (97 caracteres).
- **Mínimo sin «por token/participación/acción»:** bien. No hay mínimo, y la
  propuesta «1 USD» tampoco lo lleva.
- **Sin rentabilidad ni promesas:** no hay rentabilidad. Pero «en cualquier
  momento» suena a promesa de liquidez que el emisor puede negar. Cambio 8.
- **Palabras prohibidas** («oportunidad», «rentabilidad», «garantiz…», %):
  ninguna en los textos internos.
- **Fechas DD/MM:** «11/11/2025» lleva el año. Está bien así, porque es el año
  del KID y avisa de que es antiguo.
- **Riesgo de presentación:** con `estadoRevision: actual` (caso A), la tarjeta
  sale en verde aunque el acceso esté sin confirmar. Si alguna vez se publicara
  algo de Ondo Stocks con este conflicto abierto, tendría que ir como
  `fuentes_en_conflicto` (caso B).

Hoy no se publica nada, así que el visitante no ve ninguna tarjeta. Ondo
Finance sigue en el radar de plataformas
(`escaparate-publicacion.json` → `plataformas[ondo-finance]`) con
«confirmado_condicionado» para USDY, y esta decisión no lo cambia.

---

## 4. Calidad de la oferta para un particular en España

**Valoración: mala. Aunque el acceso se aclarara, no la admitiría.**

### Costes totales

- **Entrada:** 0 según la documentación («no fee to mint»). Las condiciones
  finales y el KID permiten hasta el 0,1 % «at the sole discretion of the
  Issuer».
- **Salida:** 0,05 % por reembolso según la documentación. Pero el KID dice
  «Actualmente, no se cobran comisiones». Se contradicen.
- **Diferencial:** existe y no está cuantificado. Lo fija el emisor con
  «target profit, and several other proprietary considerations», y la diferencia
  se la queda él. No figura en el KID ni en las condiciones finales, que dicen
  «no additional costs». **Es una falta de transparencia en costes.**
- **Costes fuera de Ondo:** para pagar hay que cambiar euros por USDC en otra
  plataforma (comisión y diferencial de esa plataforma), y el particular paga
  el gas de la cadena de bloques. Riesgo de cambio euro/dólar.
- **Dividendos:** la retención es la de una sociedad de las BVI, del 30 % en
  los dividendos de EE. UU. («this rate is 30%», Fees & Taxes).

### Liquidez real

- Hay reembolso al emisor, inmediato a USDon y a USDC si hay saldo en el
  intercambiador, solo tras la verificación de identidad y con límites por
  sesión. El emisor puede negarlo.
- No se puede salir directamente a una cuenta bancaria.
- No hay mercado regulado, SMN ni SOC en la UE. El SMN de Binance en Abu Dabi
  es solo para clientes de Binance aptos allí, y no se ha comprobado que un
  particular español lo sea.

### Solidez y supervisión

- El emisor es una sociedad instrumental de las BVI **sin supervisión**,
  constituida el 09/04/2025 (unos 19 meses).
- Tiene **patrimonio negativo**: −1,26 M USD al 31/12/2025 y −3,12 M USD al
  30/06/2026, este último sin auditar. Depende de que su grupo lo siga
  financiando. El folleto lo califica de «Risk rating: high».
- A favor:
  - custodio Alpaca Securities, bróker registrado en la SEC;
  - agente de garantías independiente (Ankura Trust), con garantía de primer
    rango sobre las acciones;
  - informes diarios de verificación;
  - auditorías de los contratos inteligentes.
- **No hay fondo de garantía de inversiones.**

### Riesgos concentrados

Los 493 tokens dependen del mismo emisor y del mismo grupo. Además:

- el emisor puede **amortizar toda la emisión** por motivos fiscales;
- puede **sustituirse por otro emisor** («The Purchasers therefore have no
  right to assert legal claims», folleto, cláusula de sustitución);
- los conflictos se resuelven por **arbitraje en Zúrich y en inglés**, salvo
  los derechos imperativos del particular del EEE.

### Transparencia documental

Hay mucha documentación pública, pero es incoherente:

- requisitos de acceso que contradicen el folleto;
- unas Sales Terms de 2025 marcadas como vigentes;
- un KID de antes del folleto nuevo, con comisiones distintas de las de la
  documentación, sin el diferencial y con un dato de cotización desfasado;
- un pie de página en francés en el KID en español;
- un suplemento antiguo marcado como «Current»;
- una FAQ que dice que los documentos solo se dan tras el alta.

### Señales de alarma

- Ninguna advertencia de la CNMV.
- No he visto promesas de rentabilidad en la documentación.
- Hay un programa de fidelidad («Ondo Private Client») que premia el **volumen
  operado** con regalos y eventos. Es un incentivo a operar mucho.
- La operativa fuera de horario tiene, según el propio emisor, diferenciales
  más amplios.

### Comparación con lo ya publicado del mismo tipo

| | Robinhood Classic Stock Tokens (publicada) | Kraken xStocks (publicada) | Ondo Stocks (candidata) |
|---|---|---|---|
| Quién te vende | Robinhood Europe, UAB (Banco de Lituania; CNMV n.º 5299) | Payward Europe Digital Solutions (CySEC 342/17; CNMV n.º 4474) | El emisor de las BVI, directamente; nadie supervisado |
| Cómo se paga | Euros en la app | Euros (en el EEE, solo dinero fiduciario) | Solo USDC desde una cartera propia |
| Mínimo | Desde 1 € | Desde 1 € | 1 USD |
| Costes publicados | 0,10 % de cambio por operación | 1 % de compra instantánea más diferencial | 0 / 0,05 % más un diferencial sin cifra; el KID dice otra cosa |
| Acceso de particulares en España | Sí, con evaluación de conveniencia | Sí, según Kraken (clientes de la UE tras su evaluación), aunque sus condiciones finales no nombran España | En conflicto dentro de los documentos del emisor |
| KID en español | Sí (7 de 7) | Sí | Sí para AAPLon (6 de 7), de 11/2025 |

Para un particular en España, las dos ofertas ya publicadas son claramente
mejores. En ellas te vende una entidad supervisada con pasaporte en la CNMV,
pagas en euros y los costes están escritos. Ondo Stocks es legal en lo
formal: tiene folleto pasaportado. Pero para el lector es peor y más arriesgada
que lo que ya hay en el catálogo. **No se admite.**
