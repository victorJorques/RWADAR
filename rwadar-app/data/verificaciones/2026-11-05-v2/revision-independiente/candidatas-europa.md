# Revisión independiente · grupo «candidatas-europa» · 05/11/2026

Revisé los cinco expedientes de este grupo. Volví a abrir yo mismo las fuentes
primarias entre las **08:24 y las 08:40 UTC** del 05/11/2026. No usé las copias
del investigador. Solo leí páginas y documentos públicos: no inicié sesión, no
hice KYC, no conecté wallets ni rellené formularios, salvo el buscador público
de advertencias de la CNMV.

- **Copias de lo leído:** `fuentes/candidatas-europa/`.
- **Inventario con hora, HTTP, bytes y SHA-256:**
  `fuentes/candidatas-europa/inventario-consultas.json`.
- **Respuestas crudas** (JSON de ESMA, App Store, folleto de Franklin y
  condiciones finales de Ondo con direcciones de contrato):
  `fuentes/candidatas-europa/crudo/`, que queda fuera de Git.

## Resultado en una línea

**Aprobado con cambios.** Ninguna candidata se propone admitir y comparto las
cinco decisiones `no_admitir`. Casi todos los hechos se sostienen con la fuente
de hoy. En **Assetera** hay que corregir tres afirmaciones: el acceso de los
particulares, la cifra de «más de 100» y el mínimo y los costes. El problema
principal es que los propios documentos de Ondo dicen que su oferta en el EEE
también es para particulares y nombran a España.

| Slug | Decisión del investigador | Mi veredicto |
|---|---|---|
| `okx-europe-xstocks` | no_admitir | Confirmado. Precisiones menores. |
| `crypto-com-tokenized-stocks-eea` | no_admitir (sin cambios) | Confirmado: sin cambios. |
| `assetera-ondo-stocks` | no_admitir | Confirmado con cambios: hay correcciones obligatorias. |
| `bybit-eu-tokenized-stocks` | no_admitir | Confirmado. Conviene matizar una frase. |
| `franklin-templeton-grbenji` | no_admitir (sin cambios) | Confirmado: sin cambios. Hay una cifra de hoy disponible. |

No hay `admitir_propuesta` ni `retirar_propuesta` en este grupo, así que los
puntos 2 y 3 del encargo no aplican.

---

## 1. OKX Europe · xStocks (`okx-europe-xstocks`)

**Documentos oficiales.** Confirmado.

- **Términos de OEM:** https://www.okx.com/en-eu/help/okx-europe-market-ltd-oem-terms-of-service
  (08:24:35Z) dicen «Last updated: 4 November 2026». Remiten los productos
  tokenizados al «Annex 2 (cf. Annex 2.A)».
- **Anexo 2.A** (PDF del CDN de OKX, 08:24:35Z): su SHA-256 `4f842a71…68c0` es
  idéntico al del investigador.
  - *Precisión:* el PDF no lleva fecha visible y sus metadatos dicen que se creó
    el 05/10/2026. La fecha 04/11/2026 es la de la página de términos, no la del
    anexo. El expediente lo dice bien, pero el resumen estructurado escribe
    «anexo 2.A … (04/11/2026)».
- **Aviso de riesgos:** el SHA-256 `5243ea8c…8fe6` es idéntico.
- **Página de KIDs** (08:29:13Z): el apartado de xStocks dice «Last Updated: 7
  September 2026».

**Producto = xStocks de Backed y retirada a una wallet propia.** Confirmado en
el anexo 2.A (08:24:35Z):

- «Issuer: Backed Assets (JE) Limited … Indirect subsidiary of Payward, Inc.»
  (Schedule A, A.1).
- Sobre la retirada: «the resulting Underlying Token Quantity is sent on-chain
  to the User's withdrawal address» (cl. 6.1).

**Advertencia de la CNMV.** Confirmado. Busqué en
https://www.cnmv.es/portal/BusquedaAdvertencias?lang=es con Playwright a las
08:28:02Z:

- `04/04/2022 HTTPS://WWW.OKX.COM/ OKX`
- `18/05/2026 HTTPS://WWW.AAYOKX.COM/ AAYOKX`
- Criterio de la búsqueda: «por tipo No autorizadas, de nombre OKX».

La advertencia sigue publicada hoy.

**Licencia en España (CNMV nº 5024).** Confirmado:

- **Datos generales**
  (https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5024,
  08:28:57Z): «OKX EUROPE MARKETS LIMITED · 5024 · 14/01/2021 · MALTA».
- **Programa de actividades** (vista=17, 08:28:59Z):
  - «2. Ejecución de órdenes … 1) Valores negociables»;
  - «3. Negociación por cuenta propia … 1) Valores negociables»;
  - servicio auxiliar «1. Custodia y administración … 1) Valores negociables».

**Mínimo null.** Confirmado. El anexo 2.A, cl. 7.1, dice: «Minimum order size
(minSz) is determined by OKX and may be updated from time to time».

**Riesgo del emisor.** Confirmado:

- A.3: «As at 31 December 2025, the Issuer had negative shareholder funds of
  approximately USD -3.2 million».
- A.5: «Payward Group Concentration Risk».
- A.1: «Custodian: Alpaca Securities LLC».

**Acceso desde España.** Confirmado:

- El anuncio del 04/11 (08:29:13Z) dice: «Please check the availability of the
  listed token or product for your region in the app».
- España no está entre las «Restricted Locations» de
  https://www.okx.com/en-eu/help/eea-risk-and-compliance-disclosure (08:29:14Z).

**Otros datos del producto.** Confirmados:

- **Pasaporte del folleto:** la CNMV recibió BPWO-80 el 11/05/2026
  (https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500001AB7C6C7F577,
  08:29:28Z).
- **KID en español de NVDAx:** «Este documento tiene fecha 04 nov. 2026», con
  «clase de riesgo 6 en una escala de 7». El SHA-256 es idéntico (08:29:19Z).

**Tarjeta interna (`resumenTarjeta`).** Las tres frases cumplen:

- tienen 68 y 82 caracteres, y el mínimo es null;
- están en castellano llano;
- están respaldadas: la cl. 7.1 dice «OKX maintains the right to halt trading».

**Decisión `no_admitir`:** la comparto. La advertencia de la CNMV basta por sí
sola.

## 2. Crypto.com · Tokenized Stocks EEA (`crypto-com-tokenized-stocks-eea`): muestra «sin cambios»

**KID público.** Confirmado. Pedí
`https://crypto.com/eea/financialservices/disclosures` a las 08:31:32Z:

- respuesta `301 location: https://crypto.com/`;
- después `302 location: https://crypto.com/us`;
- página final de EE. UU.

El centro de ayuda
(https://help.crypto.com/en/articles/15855813-about-crypto-com-tokenized-stocks-eea,
08:31:48Z) sigue enlazando el «Key Information Document» a esa dirección. Una
búsqueda web de hoy no encontró ninguna copia pública del KID.

**Términos y documento de riesgos sin cambios.** Confirmado:

- **Términos** (`/document/fccy-tokenised-equities-terms`, 08:31:31Z): SHA-256
  `1169bff5…1c6f`, igual que el 03/11. Dicen «Last Update: 11 August 2026».
- **Documento de riesgos** (`/document/fccy-tokenised-equities-risk-statement`,
  08:31:32Z): SHA-256 `8d5a498f…3fe3e`, igual que el 03/11.

**Lista de países excluidos.** Confirmado que no se localiza:

- Los términos remiten a unas «Tokenized Stocks FAQs» (cl. 3.1 d).
- La ayuda solo dice «Subject to jurisdictional availability» y «If you do not
  see Tokenized Stocks in the App, you may be in an unsupported jurisdiction».
- La búsqueda web de hoy no devuelve la lista.

**Advertencias de la CNMV.** Confirmado: son las mismas.

- **«Crypto.com»** (08:28:39Z): seis dominios ajenos, `IDCXSCRYPTO.COM`
  (19/01/2026), `DELTASCRYPTO.COM`, `ALPHASCRYPTO.COM`, `FXPROCRYPTO.COM`,
  `TRADESCRYPTO.COM` y `CCXCRYPTO.COM`.
- **«Foris»** (08:28:46Z): `FORISDAXLTD.COM` (06/10/2025) y
  `MY.FORISDAXLTD.TOP` (24/11/2025).
- La ficha CNMV nº 4485 de Foris Capital CY sigue con fecha 19/01/2018
  (08:39:13Z).

**Mínimo de 1 USD.** Se sostiene:

- La nota del 12/08/2026 (08:31:49Z) dice: «access is available from as little
  as US$1».
- La ayuda dice: «Buy as little as $1».

**Tarjeta interna.** Son 11, 57 y 64 caracteres, en castellano llano.

- *Recomendación (no obligatoria):* «Vendes en la app cuando quieras» exagera un
  poco. Los términos permiten retrasar o suspender órdenes (cl. 7.2 y 12 l), y
  fuera del horario de EE. UU. puede haber solo órdenes limitadas. Si algún día
  se publica, mejor: «Vendes en la app; puede haber pausas; no se puede sacar a
  otra wallet».

**Decisión `no_admitir`:** la comparto.

## 3. Assetera · Ondo Stocks (`assetera-ondo-stocks`): requiere correcciones

**«Hoy se ven más de 100 Ondo Stocks con precios en USDC».** Confirmado con
cambios.

- El marketplace público https://marketplace.assetera.com/en (08:32:57Z) enseña
  «589 RWAs available · 577 Public Market Token». Hay tokens «(Ondo Tokenized)»
  con «Market Primary» y precio en USDC, por ejemplo «Seagate (Ondo Tokenized)
  … 541.67 USDC».
- Buscando «Ondo» en el marketplace (08:34:46Z) salen **«102 RWAs available ·
  95 Public Market Token · 7 Portfolio»**. Son unos **95 tokens de Ondo y 7
  carteras**, no «más de 100 Ondo Stocks».
- La cifra «100+» viene de la nota de Assetera del 07/10/2026, no del
  marketplace de hoy. La nota dice: «Assetera has listed 100+ Ondo's tokenized
  US stocks and ETFs», en https://www.assetera.com/media/assetera-x-ondo,
  consultada a las 08:34:55Z.

**«La elegibilidad de Ondo limita la emisión en el EEE a profesionales o
cualificados».** Confirmado con cambios. El literal existe, pero los propios
documentos de Ondo dicen lo contrario.

- Página de elegibilidad https://docs.ondo.finance/ondo-stocks/eligibility.md
  (08:29:58Z; el mismo SHA-256 `76916fd4…ed61` que tenía el investigador):
  «Any Member State of the European Economic Area | "Professional Client" … or
  "Qualified Investor"».
- **Condiciones finales de STXon (Seagate)**, del emisor Ondo Global Markets
  (BVI) Limited y fechadas el 16/07/2026, sección «Offeror of the Tokens». Las
  enlaza públicamente la ficha de Assetera
  (https://marketplace.assetera.com/en/trading?id=648, 08:35:59Z) y las
  descargué a las 08:38:29Z. Copia en `crudo/`. Dicen: **«to both retail and
  professional investors within the EU and the EEA, particularly in the
  following countries: … Spain ("Spain") …»**.
- **Avisos importantes de Ondo**
  (https://docs.ondo.finance/ondo-stocks/important-notes.md, 08:38:59Z):
  «making many Ondo Stocks available to both professional and retail investors,
  though certain Ondo Stocks are only available to professional investors in the
  EEA/EU».
- **KID de STXon** (inglés, «Date of Production of the KID 11.11.2025»,
  08:38:28Z): tiene apartado «Intended retail investor» y riesgo 6 de 7.

El conflicto no es entre Assetera y Ondo: está **dentro de los documentos de
Ondo**. Por eso la frase «el emisor solo emite en el EEE a profesionales» no se
sostiene como hecho. Aparece en `resumenTarjeta.accesoEspana`, en
`motivoDecision`, en `porQueNo` y en el resumen del grupo.

**Licencia en España (CNMV nº 5216).** Confirmado:

- **Datos generales** (08:30:08Z): «5216 · 26/10/2023 · Rotenturmstraße 13, 3.
  Stock, Tür 7 · Viena».
- **Programa de actividades** (vista=17, 08:30:09Z): solo «1. Recepción y
  transmisión de órdenes», «4. Gestión de carteras» y «5. Asesoramiento en
  materia de inversión». No hay servicios auxiliares, así que no tiene custodia.
- **FMA de Austria**
  (https://www.fma.gv.at/en/search-company-database/?cname=Assetera…,
  08:30:22Z): «Wertpapierfirma gemäß § 3 WAG 2018 · Konzession seit
  28.02.2022 · Anlageberatung · Portfolioverwaltung · Annahme und Übermittlung
  von Aufträgen», con dirección «Ungargasse 37/1».

Las dos direcciones distintas se confirman.

**Folleto de Ondo BPWO-68.** Confirmado con cambios.

- **CNMV**
  (https://www.cnmv.es/portal/Consultas/Folletos/Pasaportes?denominacion=&lei=984500Z0Q6A5E8BE2B61,
  08:29:29Z): «12/11/2025 · LIECHTENSTEIN · BPWO-68 · 11/11/2025».
- **ESMA** (registro Solr, 08:29:48Z): solo hay BPWO-68 y los suplementos
  SUPP-56 (05/05/2026) y SUPP-63 (28/08/2026), con SPAIN en la lista. No hay
  ningún folleto base posterior.
- **La caducidad ya no es una deducción.** Las condiciones finales de STXon lo
  dicen literalmente: «The validity of the Base Prospectus … will expire on the
  11.11.2026 pursuant to Art. 12 of the Prospectus Regulation. After this date,
  the public offer will be made on the basis of one or more successor base
  prospectus(es)».
- Hay que cambiar «caduca hacia el 11/11/2026» por «caduca el 11/11/2026»,
  citando esas condiciones finales.

**«Mínimo y costes no publicados».** Confirmado con cambios. Es cierto solo para
lo que cobra Assetera:

- La ficha de STXon en el marketplace (08:35:59Z) dice «The platform fee is added
  on top of this amount» y enseña «Fee: —» sin iniciar sesión. No muestra
  mínimo.
- Las condiciones finales del emisor, que son públicas, sí fijan:
  - «The minimum subscription amount is USDC 0.01»;
  - «Purchaser Fees … up to 0.1% of the market price» al emitir y al reembolsar.
- Ese mínimo es del emisor. No prueba el mínimo de Assetera.

**Bloqueo «folleto, condiciones finales y KID de Ondo no leídos».** Se puede
resolver. Los documentos están enlazados en público desde cada ficha del
marketplace: «Prospectus», «First Supplement», «Tokenization Terms», «Term
Sheet» y «Key Information Document». Están en
`stasseteraassetsprod.blob.core.windows.net`.

**Advertencias de la CNMV.**

- **«Assetera»** (08:39:31Z): «No hay datos disponibles».
- **«Ondo»** (08:39:46Z): solo coincidencias ajenas (BANKLONDONGROUP.UK,
  LONDONCAPITALFX.EU, LONDONEX.COM…).

**Decisión `no_admitir`:** la comparto, pero por estos motivos corregidos:

- Assetera no publica su comisión ni su mínimo;
- su licencia en España es solo de recepción y transmisión, gestión y
  asesoramiento, sin custodia;
- el folleto base de Ondo caduca el 11/11/2026 y hoy no hay sucesor en ESMA;
- los documentos de Ondo se contradicen sobre la venta a particulares.

## 4. Bybit EU (`bybit-eu-tokenized-stocks`)

**Licencia en la FMA.** Confirmado. La búsqueda «Bybit» en
https://www.fma.gv.at/en/search-company-database/?cname=Bybit… (08:30:20Z) da
«2 Search results»:

- «Bybit EU GmbH · Category: CASP - Crypto-Asset Service Provider (AT) · FN
  636180i»;
- «Bybit Payments GmbH · E-Money-Institutions».

Bybit X GmbH no aparece y ninguna de las dos es una empresa de servicios de
inversión.

**CNMV.** Confirmado. El listado de empresas de servicios de inversión del EEE
en libre prestación
(https://www.cnmv.es/portal/Consultas/listadoentidad.aspx?id=1&tipoent=4,
08:30:36Z) no tiene ninguna entidad «Bybit». Sí figuran Assetera, Bitpanda
Financial Services, Foris Capital CY, Gemini Intergalactic EU Artemis, OKX
Europe Markets y Payward Europe.

**Advertencias de la CNMV.** La búsqueda «Bybit» (08:39:39Z) solo da
`BYBITPROFIT.IO` (29/04/2024), que es ajeno.

**Contraste con la prensa** (secundario, solo para descubrir). Un artículo de
Crypto Briefing del 10/09/2026 dice que la oferta europea de Bybit es spot,
margen y tarjeta, y que «European users can't touch any of it» respecto a las
acciones.

**Tarjeta interna.**

- *Recomendación (no obligatoria):* «No: Bybit EU no tiene licencia para vender
  acciones tokenizadas» es una conclusión jurídica, no un literal. Lo que dice
  el registro es más exacto: «No: Bybit EU no tiene licencia de valores (MiFID)
  ni figura en la CNMV» (69 caracteres).

**Decisión `no_admitir`:** la comparto.

## 5. Franklin Templeton · grBENJI (`franklin-templeton-grbenji`): muestra «sin cambios»

**Folleto y KID con el mismo SHA-256.** Confirmado:

- **Folleto** (08:32:00Z): `ec0458b6…dade9`, igual que el 03/11. Sigue diciendo
  «As at the date of this Prospectus, the App may not yet be available to retail
  Investors».
- **KID en español** (08:32:01Z): `1b9efc78…a75a`, igual que el 03/11. Dice
  «Fecha de producción del KID: 15/06/2026» y «Puede vender sus acciones en
  cualquier día de negociación».

**App Benji ausente de la App Store española.** Confirmado:

- `https://itunes.apple.com/lookup?id=1551677725&country=es` (08:32:02Z)
  devuelve «resultCount: 0».
- Con `country=us` sale «Benji Investments», de «Franklin Advisers, Inc».

**Comercializadoras en la CNMV (IIC nº 2284).** Única comercializadora hoy:
«FRANKLIN TEMPLETON INTERNATIONAL SERVICES, S.À.R.L., SUCURSAL EN ESPAÑA»
(08:39:12Z).

**Rentabilidad a null.** Confirmado: aplica bien la regla, porque el
investigador no reabrió la ficha. Pero hoy la ficha sí se puede leer. Renderizada
a las 08:32:20Z dice:

- «7-Day Net Yield · Fecha 03.11.2026 (Actualización diaria) · 3,78%»;
- «Inversión Mínima USD 20».

Como no hay tarjeta, no hace falta usarlo. Si se quiere, puede quedar como dato
del día, con fecha 03/11.

**Tarjeta interna.** Dos recomendaciones (no obligatorias):

- **Acceso:** el folleto dice «may not yet be available», que es más prudente que
  «aún no está disponible». Propuesta: «No confirmado: el folleto dice que la app
  puede no estar aún abierta a particulares».
- **Salida:** falta una preposición. Mejor: «Reembolso en cualquier día de
  negociación, según el KID».

**Decisión `no_admitir`:** la comparto.

---

## Bloqueos comprobados

- **KID de Crypto.com:** el bloqueo se reproduce (301 y 302 hacia crypto.com/us
  a las 08:31:32Z).
- **MFSA (Malta):** se reproduce, pero el motivo es otro.
  `https://www.mfsa.mt/financial-services-register/` responde **403 «Sorry, you
  have been blocked» (Cloudflare)** desde nuestra conexión (08:37:25Z). No es
  solo que necesite JavaScript. La entidad de OKX queda acreditada por la CNMV
  (nº 5024).
- **Registro de fichas referenciadas a activos de ESMA (ARTZZ.csv):** sigue
  vacío. Solo trae la cabecera, 276 bytes, consultado a las 08:37:35Z.
- **LCX Earn:** la página dice «LCX Earn is closed to new investments»
  (08:37:35Z).
- **Documentos de Ondo:** el bloqueo **se puede resolver**, porque están
  enlazados en público desde Assetera (ver el punto 3).
- **No comprobado por mí:** la tabla de comisiones de OKX en el EEE (0,08 % y
  0,10 %), la API de OKX y Floin AG. No son cambios críticos y no afectan a las
  decisiones.

## Correcciones obligatorias (antes de usar estos expedientes)

1. **`assetera-ondo-stocks`, acceso.** Hay que sustituir «el emisor solo emite en
   el EEE a profesionales» por el conflicto real, citando tres fuentes de Ondo:
   - la página de elegibilidad, que limita el EEE a profesionales o
     cualificados;
   - las condiciones finales de STXon (16/07/2026), que dicen «to both retail
     and professional investors … Spain»;
   - los avisos importantes, que dicen «many Ondo Stocks available to both
     professional and retail investors».

   Los textos afectados son `resumenTarjeta.accesoEspana`, `motivoDecision`,
   `prioridadEditorial.porQueNo` y el resumen del grupo. Texto propuesto para la
   tarjeta: «Sin confirmar: los documentos de Ondo se contradicen sobre la venta
   a particulares» (79 caracteres).
2. **`assetera-ondo-stocks`, número de productos.** «Más de 100 Ondo Stocks
   visibles hoy» debe decir: «unos 95 tokens de Ondo y 7 carteras (102
   resultados) en el marketplace del 05/11; la cifra "100+" es de la nota del
   07/10».
3. **`assetera-ondo-stocks`, folleto, mínimo y costes.** Hay que hacer tres
   cambios:
   - el folleto base caduca **el 11/11/2026** (lo dicen literalmente las
     condiciones finales) y hoy no hay sucesor en ESMA;
   - el mínimo y la comisión que **Assetera** no publica siguen en null, pero
     hay que registrar que el emisor fija 0,01 USDC y comisiones de hasta el
     0,1 % en sus condiciones finales públicas;
   - el bloqueo «documentos de Ondo no leídos» se sustituye por los enlaces
     públicos de la ficha del marketplace.

Correcciones recomendadas (no bloquean):

- **OKX:** la fecha del anexo 2.A es la de la página de términos, no la del PDF.
- **Bloqueo de la MFSA:** el motivo es Cloudflare 403, no solo que necesite
  JavaScript.
- **Matices en los textos internos** de Crypto.com, Bybit y Franklin (ver cada
  apartado).
