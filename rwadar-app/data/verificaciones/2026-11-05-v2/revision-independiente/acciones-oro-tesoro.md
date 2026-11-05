# Revisión independiente · grupo acciones-oro-tesoro · 5 de noviembre de 2026

Revisor: Claude, sin haber preparado estos expedientes. Volví a abrir yo mismo
las fuentes primarias entre las **08:20 y las 08:31 UTC del 05/11/2026**, sin
iniciar sesión, sin KYC, sin wallets ni formularios. Todo lo leído está en
`fuentes/acciones-oro-tesoro/`, con URL, código HTTP, hora, bytes y SHA-256 en
`fuentes/acciones-oro-tesoro/inventario-consultas.json` (58 consultas). Lo que
lleva direcciones o JSON largos está en `crudo/`, fuera de Git.

## Veredicto

**Aprobado.** No encontré nada que contradiga al investigador. Las cuatro
decisiones se sostienen con las fuentes de hoy:

| Ficha | Decisión del investigador | Mi veredicto |
|---|---|---|
| Robinhood · Classic Stock Tokens | mantener | confirmado |
| Kraken · xStocks | mantener (el aviso de España se queda) | confirmado |
| Prosegur Digital Gold | mantener | confirmado |
| mTBILL (Midas) | actualizar (valor por token y acceso desde España) | confirmado |

No hay candidatas ni retiradas en este grupo. Tres de las cuatro fichas son
«sin cambios», así que las comprobé todas (no por muestreo).

No hay correcciones obligatorias. Dejo tres notas para el coordinador al final.

## mTBILL (la única que cambia)

### 1. Valor por token: 1,0769 → 1,0773 USD · confirmado

- Leí yo el oráculo en Ethereum (`eth_call` a
  `0x056339C044055819E8Db84E71f5f2E1F536b2E5b`, vía
  https://ethereum-rpc.publicnode.com, 08:25:37 UTC, bloque 26.347.423):
  `latestRoundData` → ronda **488**, valor `107725738` con 8 decimales
  (**1,07725738 USD**), actualizado el **04/11/2026 a las 17:45:23 UTC**.
  `description()` = «mTBILL/USD». Redondeado a 4 decimales: **1,0773 USD**.
- La ronda 486 (lo publicado) vale 1,07685452 USD (02/11, 13:20 UTC) → 1,0769.
  La 487 (03/11) también da 1,0769.
- Es el oráculo que manda el contrato: las Condiciones Finales (p. 3,
  «Oracle / publication source for NAV per mToken … Ethereum:
  0x056339C0…») lo nombran, y los dos vaults de mTBILL leen un DataFeed
  (`0xfcee9754…`) cuyo `aggregator()` es justo esa dirección (08:26 UTC).
- Texto propuesto «Valor por token · 04/11/2026: 1,0773 USD (oráculo del
  emisor)»: correcto, con fecha del dato y fuente. Es una ficha principal, así
  que puede llevar precio.

### 2. Acceso desde España: España entre los «Permitted Jurisdictions» · confirmado

- `midas.app/llms-full.txt` (08:25:53 UTC) devuelve hoy la página de inicio de
  la web, y esa página carga `/assets/main-C67ipI_t.js`. Es, por tanto, el
  código que sirve hoy midas.app.
- Descargué ese archivo (08:26:05 UTC, mismo SHA-256 que el investigador:
  `19e9c54a…`). Contiene el aviso de entrada versión `1.0.2`, título
  «Eligibility & Jurisdiction»: *«The information on this website is directed
  only at persons who are resident or located in the following jurisdictions:
  Austria, Belgium, France, Germany, Ireland, Italy, Luxembourg, Malta, the
  Netherlands, Poland, Portugal, Romania, Spain, and Sweden (the “Permitted
  Jurisdictions”).»* Después viene la ventana «Confirm your eligibility», que
  envía el país del visitante a `/disclaimer/accept`.
- El mismo código asigna mTBILL a Midas Software GmbH con
  «Public offer under the EU Prospectus Regulation» (`offer: public`). Busqué
  listas de países bloqueados en el código: solo hay un bloqueo geográfico que
  decide el servidor y uno específico para el Reino Unido. España no aparece
  excluida en ningún sitio.
- Los 14 países son los mismos que las Condiciones Finales (parte B, p. 5:
  «Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta,
  Austria, Belgium, Luxembourg, France, Italy, Spain, …»), que además dicen
  «Target market … retail clients» y «Prohibition of Sales to EEA Retail
  Investors: not applicable» (p. 6).
- En cadena (08:26:46 UTC): vaults de emisión y reembolso sin pausa y con
  `greenlistEnabled() = false`; mínimo de emisión 0; mínimo de reembolso
  1 mTBILL; comisión de reembolso inmediato 7 (0,07 %).
- **Alcance:** el texto se leyó en el código servido, no en pantalla.
  midas.app sigue dando 403 a curl (08:25:53 UTC). No es una prueba de que el
  alta de un residente en España se apruebe: eso solo se ve con KYC, que no se
  hace. La documentación (llms-full.txt, «Eligibility & Compliance») dice que
  puede pedir verificación de identidad según el riesgo.

### 3. Conflicto de reembolso: sigue igual · confirmado

- Condiciones Finales (GitBook, 08:27:14 UTC, SHA-256 `b1e58001…`, el mismo
  del 01/11 y el 03/11; última modificación del archivo 05/08/2026), p. 4:
  «Redemption Gates 25% of the aggregate number of outstanding mTokens per
  settlement day» y «Holdback Percentage up to 5%».
- KID en español (08:27:15 UTC, SHA-256 `6c228709…`, el mismo; modificado el
  12/10/2026), p. 3: «el Emisor no reembolsará más del 15 % … podrá retenerse
  hasta el 50 % del importe».
- ESMA (08:27:28 UTC): para el ISIN CH1371002986 solo hay 3 condiciones
  finales y la última sigue siendo **FTWS-1420** (17/07/2026). El emisor tiene
  41 documentos, el último FTWS-2788 (26/10/2026, otro ISIN), y ningún
  suplemento.
- La exportación de la documentación (`docs.midas.app/llms-full.txt`,
  08:25:52 UTC) tiene el mismo SHA-256 que el 01/11 y el 03/11
  (`aca8b6c7…`): la página legal de mTBILL sigue enlazando los mismos
  identificadores de archivo.
- **Límite:** no puedo confirmar que el KID enlazado hoy en la página legal
  sea el mismo archivo, porque esa página da 403 y la API pública de GitBook
  no responde (404). Con lo que sí se puede leer, el conflicto sigue. El estado
  debe seguir en «fuentes_en_conflicto» y el aviso se mantiene.

### 4. La tarjeta en línea sale sin cifras · confirmado

`lectura-publica/ofertas-v2.json` (07:56 UTC) muestra mTBILL con
`estado_revision: fuentes_en_conflicto`, `disponible_es: null` y el resumen
«Condiciones pendientes de nueva revisión…». Que el lector vea o no las cifras
con el aviso del conflicto es una decisión editorial, no de esta revisión.

### 5. Los tres textos de la tarjeta · confirmados

| Dato | Texto | Caracteres | Respaldo |
|---|---|---|---|
| Mínimo | «Sin mínimo; pagas en USDC (dólar digital)» | 41 | CF p. 4 «Minimum Investment Amount: not applicable»; KID p. 1; en cadena `minAmount() = 0` |
| Acceso desde España | «Sí: oferta pública en España para particulares; la web de Midas incluye España entre sus países permitidos» | 106 | CF parte B (España, minoristas) y aviso v1.0.2 del código de hoy |
| Salida | «Reembolso al emisor cualquier día hábil, con tope diario (25 % según contrato, 15 % según KID); sin reventa» | 107 | KID p. 3 «Puede solicitar el reembolso cualquier Día Hábil» y «No debe presuponer que podrá vender el Producto a nadie distinto del Emisor»; CF p. 4 |

Castellano llano, menos de 120 caracteres y sin cifras inventadas. Es una
ficha principal: puede llevar el valor por token con su fecha.

### Lo demás de mTBILL que también comprobé

- Sin advertencias de la CNMV para «Midas» ni para «Midas Software» (08:27:38 y
  08:27:39 UTC, «No hay datos disponibles»). Búsqueda de control con «Gemini»:
  sí devuelve resultados (08:27:41 UTC), así que el buscador funciona.
- Riesgos de la tarjeta: KID p. 2 «clase de riesgo 7 en una escala de 7»;
  CF p. 9 «The financial year 2025 ended with a reported deficit not covered by
  equity of EUR 5’778’815.22». Siguen vigentes.
- 66.740.011,54 mTBILL en Ethereum (`totalSupply`, 08:25:37 UTC). Coincide.
- No intenté abrir midas.app/mtbill con navegador: la sesión denegó esa
  acción. El APY sigue sin poder leerse: está bien que la rentabilidad vaya en
  `null`.

## Kraken · xStocks (sin cambios)

### Acceso desde España: las condiciones finales siguen sin incluir España · confirmado

- ESMA (08:21:33 UTC, emisor LEI 984500001AB7C6C7F577): 1.730 documentos;
  **44 condiciones finales el 03/11/2026**, con pasaporte el 04/11, y ninguna
  posterior. En todas, «SPAIN» aparece en la lista de Estados del pasaporte.
- Para intentar refutar al investigador leí **condiciones finales distintas**
  de las suyas. Tres de las del 03/11: CH1588666854 (FTWS-2810), CH1588667126
  (FTWS-2838) y CH1588666763 (FTWS-2830). Cuatro más de otras fechas:
  CH1588666771 (03/11, ASND), CH1588665997 (15/10, ZAL), CH1580497092 (01/10,
  ACGL) y CH1588665070 (28/09, LUNR). Releí también las de SPYx (08/05, mismo
  SHA-256 `280159d4…`). **Las ocho dicen lo mismo** en «6. Additional
  Information»: *«Country(ies) of offer(s): The Products will be offered in
  Liechtenstein and Switzerland (only to Swiss Professional Investors). The
  right to offer in other jurisdictions is explicitly reserved.»* España solo
  aparece justo debajo, en «Country(ies) where the Base Prospectus has been
  notified».
- Folleto base (MFSA, 08:23:13 UTC, mismo SHA-256 `47be9272…`): una oferta
  pública en un Estado del EEE solo vale «if the Final Terms in relation to the
  securities specifies that an offer … may be made … in that Relevant Member
  State». Por tanto, **el primer aviso no se puede quitar**, y el segundo
  («RWAdar no ha encontrado ningún documento oficial…») sigue vigente.
- Kraken UE en español (`eu.kraken.com/es/xstocks`, 08:22:55 UTC, mismo
  SHA-256 que el investigador `a8e93d8c…`): «Los xStocks están disponibles
  para clientes de PEDSL-CY ubicados en la UE que hayan completado con éxito la
  evaluación de idoneidad obligatoria…». No nombra España.
- Soporte (08:22:56 UTC, actualizado el 18/06/2026): no disponible en
  EE. UU., Australia, Canadá, Bélgica, Reino Unido y regiones prohibidas.
  España no está excluida.

### Documentos del emisor y KID · confirmado

- Último suplemento en ESMA: 29/09/2026. No hay ninguno nuevo.
- KID en español de SPYx (08:22:30 UTC) y NVDAx (08:28:37 UTC): «Este
  documento tiene fecha 04 nov. 2026», riesgo 5/7 y 6/7. Mismo SHA-256 que el
  investigador. Al compararlo con el del 03/11 (fecha 02/11), los costes son
  iguales. Solo cambian un poco los escenarios de rentabilidad (p. ej.,
  moderado a 1 año: 11.402 → 11.410 USD). La tarjeta no usa nada de esto.

### Resto sin cambios · confirmado

- «Start with as little as €1 EUR» y «130+» (08:22:06 UTC); pie: «The issuer
  of the xStocks is not affiliated to the Kraken Group» (sigue contradiciendo
  al suplemento, como dice el aviso).
- Comisiones en inglés (08:23:04 UTC): «The standard 1% instant buy/sell
  trading fee applies when purchasing xStocks using other assets» y «Small
  instant trades carry a fee of up to $2 instead of the 1% fee». La versión
  española (08:22:55 UTC) sigue sin la frase de los 2 USD.
- CySEC (08:22:22 UTC): «Licence Number: 342/17». CNMV (08:22:07 UTC):
  PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED, n.º 4474, desde 05/01/2018.
- CNMV, pasaportes (08:22:09 UTC, mismo SHA-256): «11/05/2026 · BACKED ASSETS
  (JE) LIMITED · LIECHTENSTEIN · BPWO-80 · 08/05/2026».
- CNMV, advertencias: sin resultados para Kraken, Payward, Backed ni xStocks
  (08:22:24–08:22:29 UTC).
- FAQ de soporte (08:31:00 UTC): «Última actualización: 30 de octubre de
  2026» y «Dividendo neto (tras la retención fiscal del 30% en EE. UU.)». El
  aviso de dividendos sigue vigente.
- Textos de tarjeta (sin cambio de fondo): 46, 100 y 93 caracteres;
  respaldados por la FAQ en español («evaluación de idoneidad», «Vender … a USD»,
  «retirar tus xStocks a un monedero compatible»).

## Robinhood · Classic Stock Tokens (sin cambios)

### Documentos, web, registros y advertencias · confirmado

- KID, descripción de servicios y tabla de tarifas (08:20:28–08:20:29 UTC):
  SHA-256 `d744e3ac…`, `4e3ab0a2…` y `614b0f5b…`, los mismos que el 01/11, el
  03/11 y el investigador. El KID dice: «Date of Document Production: 1 July
  2026», «7 out of 7», «Recommended holding period: 1 year», «Robinhood Europe
  may suspend the closing of positions». La tabla de tarifas: «0.10% currency
  conversion fee».
- Web en español (08:20:41 UTC): «Empieza con tan solo 1 euro», «más de 2.000
  Classic Stock Tokens», «desde el lunes a las 2 de la madrugada CET/CEST hasta
  el sábado a las 2 de la madrugada» y «Compra y vende Classic Stock Tokens
  24/5». El texto es el mismo que copió el investigador (solo cambian los
  saltos de línea de la extracción).
- Banco de Lituania (08:21:11 UTC): licencia de intermediación cat. A (desde
  03/04/2025), CASP (desde 29/05/2025) y entidad de pago (desde 12/03/2026).
- CNMV (08:21:10 UTC): ROBINHOOD EUROPE, UAB, n.º 5299, 21/04/2025. En el
  programa de actividades (vista 17) figuran los derivados. Relación de
  proveedores de criptoactivos (08:21:16 UTC, mismo SHA-256 `f9cb1b05…`):
  Robinhood desde 16/06/2025.
- CNMV, advertencias «Robinhood» (08:21:13 UTC): «No hay datos disponibles».

### Propuesta no crítica para la métrica «Salida» · confirmada

«Vendes a Robinhood en la app, 24/5; puede suspender el cierre» se apoya en
la web (24/5, lunes 2:00 a sábado 2:00) y en el KID (p. 1: «request that
Robinhood Europe buy it back from you at any time»; p. 3: suspensión). Los
textos de la tarjeta (9, 108 y 107 caracteres) también se sostienen; el test
de conveniencia está en la descripción de servicios, §5: «appropriateness
questionnaire».

## Prosegur Digital Gold (sin cambios en la tarjeta)

### Precio del gramo 122,64 € · confirmado (no va en la tarjeta)

App sin iniciar sesión (Playwright, 08:23:57 UTC): «Precio de compra 122.64 €».
El 03/11 (10:27:01 UTC) eran 116.81 €, según la captura de ese día. Está bien
no subirlo a la tarjeta: cambia durante el día.

### Contrato, comisiones, salida, registro y advertencias · confirmado

- Condiciones (Playwright, 08:24:07 UTC): el texto es **idéntico carácter a
  carácter** al del investigador y a las capturas del 01/11 y del 03/11
  (71.548 caracteres). Dice: «Actualizado el 08/07/2026»; «Precio LBMA diario +
  4%» y «Precio LBMA diario - 6%»; «en un plazo de 1 a 7 días hábiles
  aproximadamente»; «6.7. LIMITACIONES O SUSPENSIÓN DE RECOMPRA»; «SU
  COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR
  FINANCIERO»; pagos «en EUROS para los Clientes residentes en el Espacio
  Económico Europeo».
- Web (08:24:46 UTC): «Compra mínima ✔ 1 gramo» (respalda el mínimo). Sigue
  diciendo «Menos de 24 horas» y «Liquidez sin restricciones», que el contrato
  no respalda. Los avisos publicados siguen vigentes.
- CNMV: PROSEGUR CUSTODIA DE ACTIVOS DIGITALES, S.L., PSC (España), desde el
  30/06/2026 (custodia, recepción y transmisión de órdenes, transferencia).
  ESMA CASPs (08:24:56 UTC, mismo SHA-256 `14d19dfd…`): igual. Sin
  advertencias de la CNMV para «Prosegur» (08:24:55 UTC).
- Textos de tarjeta (53, 89 y 115 caracteres): respaldados por la web
  (1 gramo) y por el contrato (KYC, euros en el EEE, recompra en 1–7 días,
  suspensión y topes).

## Bloqueos de esta revisión

1. midas.app/mtbill, midas.app y la página legal de mTBILL en docs.midas.app
   dan 403 a curl (08:25:53–08:25:54 UTC). La sesión no me dejó probar con
   navegador. Sin APY y sin poder ver el aviso en pantalla.
2. La API pública de GitBook no resuelve los archivos de la página legal (404).
   No puedo asegurar que el KID enlazado hoy sea el mismo archivo (ver nota 2).
3. Kraken: no abrí assets.backed.fi (bloqueo por país, según el investigador);
   los documentos se leyeron en ESMA, MFSA y el servicio documental del emisor.
   Leí 8 de las condiciones finales del emisor, no las 1.730.
4. Robinhood: sigue sin lista oficial de países ni red blockchain nombrada.
5. Prosegur: sigue sin informes de auditoría ni póliza publicados.

## Notas para el coordinador (no obligatorias)

1. **mTBILL, lista blanca:** el KID (p. 3) dice que para reembolsar o
   transmitir hace falta que el emisor incluya la wallet en la lista de
   direcciones autorizadas («greenlist»). En cadena, los dos vaults tienen hoy
   `greenlistEnabled() = false`. No cambia la tarjeta (el aviso «otra wallet
   autorizada» sigue al KID), pero el expediente no debería presentar «sin
   lista blanca» como regla del producto, solo como estado de hoy en cadena.
2. **mTBILL, vigencia del KID:** la frase «mismos SHA-256 y ningún documento
   nuevo en ESMA» vale para las Condiciones Finales. Los KID no se registran
   en ESMA, y la página que los enlaza está bloqueada. Que el conflicto «sigue»
   significa «sigue en los documentos que se pueden leer». Es otra razón para
   mantener «fuentes_en_conflicto».
3. **Kraken, KID:** «mismos costes» es exacto, pero los escenarios de
   rentabilidad sí cambian algo con la nueva fecha. No afecta a la tarjeta.
