# Revisión independiente · grupo acciones-oro-tesoro · 10 de noviembre de 2026

Revisor: Claude, sin haber preparado estos expedientes. Abrí yo mismo las
fuentes primarias entre las **09:22 y las 09:32 UTC del 10/11/2026**, sin
iniciar sesión, sin KYC, sin wallets y sin formularios. Lo leído está en
`fuentes/acciones-oro-tesoro/` (extractos cortos, sin datos personales). La URL,
el código HTTP, la hora, los bytes y el SHA-256 de cada consulta están en
`fuentes/acciones-oro-tesoro/inventario-consultas.json` (57 consultas). Las
respuestas de cadena y de ESMA están en `crudo/`.

## Veredicto

**Aprobado con cambios.** No encontré nada que contradiga las cuatro decisiones
del investigador. La única cifra que cambia (mTBILL) es exacta. Hay dos
correcciones obligatorias: una sobre cómo se explica el acceso de mTBILL y otra
sobre las copias del grupo. Ninguna de las dos cambia una tarjeta.

| Asunto | Decisión del investigador | Mi veredicto |
|---|---|---|
| mTBILL (Midas) | actualizar (valor por token) | confirmado con cambios |
| Robinhood · Classic Stock Tokens | mantener | confirmado |
| Kraken · xStocks | mantener (el primer aviso se queda) | confirmado |
| Prosegur Digital Gold | mantener | confirmado |
| Copias del grupo (datos personales) | no lo trata | rechazado: hay que recortarlas |

Este grupo no trae candidatas (`admitir_propuesta`) ni retiradas. Hay tres fichas
«sin cambios» y las comprobé todas, no por muestreo.

## mTBILL (la única que cambia)

### 1. Valor por token: 1,0773 → 1,0776 USD · confirmado

- Leí el oráculo en Ethereum con dos nodos distintos:
  - `ethereum-rpc.publicnode.com`, a las 09:22:59 UTC (bloque 26.383.586);
  - `eth.drpc.org`, a las 09:23:01 UTC (mismo bloque).
- `latestRoundData` de `0x056339C044055819E8Db84E71f5f2E1F536b2E5b` da
  **ronda 491**, `answer = 107756597` con 8 decimales (**1,07756597 USD**),
  `updatedAt = 2026-11-09T14:23:59Z`. `description()` = «mTBILL/USD».
  Redondeado a 4 decimales da **1,0776 USD**. A las 09:29 UTC todavía no había
  ronda del 10/11.
- Las rondas anteriores (`getRoundData`, 09:29:19 UTC) son 488 = 1,07725738
  (04/11, lo publicado), 489 = 1,07736876 (05/11) y 490 = 1,07746618 (06/11).
  Ninguna se salta.
- Es el oráculo que fija el contrato. Las Condiciones Finales dicen «Oracle /
  publication source for NAV per mToken — Ethereum:
  0x056339C044055819E8Db84E71f5f2E1F536b2E5b». Los dos vaults de mTBILL leen
  el DataFeed `0xfcee9754…`, cuyo `aggregator()` es esa misma dirección y cuyo
  `getDataInBase18()` da 1,07756597 (09:29:19 UTC).
- El texto «Valor por token · 09/11/2026: 1,0776 USD (oráculo del emisor)» es
  correcto: lleva la fecha del dato y su fuente, y es una ficha principal.

### 2. Documentos, registros y avisos · confirmado

- Condiciones Finales (GitBook, 09:23:42 UTC): SHA-256 `b1e58001…`, el mismo
  que el investigador y que el 01/11, el 03/11 y el 05/11. Dicen:
  - «Minimum Investment Amount: not applicable»;
  - «Redemption Gates: 25% … per settlement day» y «Holdback Percentage: up
    to 5%»;
  - «Offer(s) to the Public … Spain» (14 países);
  - «Target market … retail clients»;
  - «Prohibition of Sales to EEA Retail Investors: not applicable»;
  - «The financial year 2025 ended with a reported deficit not covered by
    equity of EUR 5’778’815.22».
- KID en español (09:23:42 UTC): SHA-256 `6c228709…`, el mismo. Dice «clase de
  riesgo 7 en una escala de 7», «no reembolsará más del 15 %», «podrá
  retenerse hasta el 50 %» y «Midas Software GmbH no es un banco y no está
  autorizada ni supervisada como entidad».
- **El conflicto de reembolso sigue igual** (25 %/5 % frente a 15 %/50 %). El
  estado tiene que seguir en «fuentes_en_conflicto» y el aviso se queda.
- ESMA (09:24:02 y 09:24:06 UTC):
  - el emisor tiene 41 documentos (38 condiciones finales y 3 folletos base,
    ningún suplemento); el último es de 26/10/2026 y es de otro producto;
  - para el ISIN CH1371002986, el documento más reciente sigue siendo el del
    17/07/2026, con SPAIN entre los Estados.
- CNMV, pasaportes (09:24:07 UTC): «17/07/2026 · Midas Software GmbH ·
  LIECHTENSTEIN · BPWO-84 · 17/07/2026».
- Advertencias de la CNMV (09:25:00 y 09:25:02 UTC): «Midas» y «Midas
  Software» dan «No hay datos disponibles». La búsqueda de control «Gemini»
  (09:25:08 UTC) sí devuelve resultados.
- En cadena (09:22:59 UTC), los vaults de emisión y de reembolso dan
  `paused() = 0` y `greenlistEnabled() = 0`. El reembolso inmediato tiene una
  comisión de 7 (0,07 %) y un mínimo de 1 mTBILL. Hay 66.128.570,82 mTBILL en
  Ethereum. Todo coincide con el investigador.
- La exportación `docs.midas.app/llms-full.txt` (09:23:11 UTC) tiene el mismo
  SHA-256 `aca8b6c7…`. `midas.app/mtbill`, `midas.app` y la página legal de
  mTBILL dan 403 (09:23:11–09:23:12 UTC). El APY sigue sin poder leerse, así
  que está bien dejar la rentabilidad en `null`.
- Los seis avisos publicados siguen vigentes con estas fuentes.

### 3. Acceso desde España · confirmado, pero con una corrección

- El código que sirve hoy la web es `main-BSIncFBO.js`: lo carga la página de
  inicio que devuelve `midas.app/llms-full.txt` (09:24:07 UTC). Lo descargué
  (09:23:42 UTC, SHA-256 `bc05508e…`, el mismo que el investigador) y confirmo:
  - El aviso de entrada «1.0.2» dice: «directed only at persons who are
    resident or located in … Spain, and Sweden (the “Permitted
    Jurisdictions”)».
  - `MQ={[V.MTBILL]:AQ,…}`, con `AQ` = «Public offer under the EU Prospectus
    Regulation», `offer: public`.
  - La ventana «Confirm your investor eligibility» (inversor cualificado o
    100.000 €) solo la activan mKRalpha y mM1-USD. Para mTBILL,
    `requiresEligibilityCheck` es falso.
  - En la ficha de mTBILL, la elegibilidad dice «Accessible to investors in
    eligible jurisdictions.».
- Con eso y con las Condiciones Finales (oferta pública en España, apta para
  minoristas), el texto publicado «Sí: oferta pública en España para
  particulares; la web de Midas incluye España entre sus países permitidos» se
  sostiene. Sigue sin haber una frase del emisor dirigida a particulares
  españoles. Tampoco se ve que el alta se apruebe, porque no se hace KYC.
- **Lo que no se sostiene:** el investigador usa «la lista blanca está
  desactivada en cadena» como prueba de que un particular puede comprarlo. El
  KID en español (p. 3) dice lo contrario: para reembolsar, el emisor tiene que
  haber incluido «su dirección de wallet en la lista de direcciones autorizadas
  (greenlist)», y «el Producto solo puede transmitirse a una persona cuya
  dirección de wallet haya sido incluida por el Emisor en la lista». Que hoy el
  contrato no aplique ese control no dice nada de quién puede hacer el alta.
  → **Corrección obligatoria 1.**
- Otra discrepancia que el expediente no registra: el mismo código de la web
  dice de mTBILL «Fully transferable token, no restrictions.». El KID, en
  cambio, limita la transmisión a wallets autorizadas. El aviso publicado («…
  solo puedes salir reembolsando al emisor o transmitiendo a otra wallet
  autorizada») sigue al KID, que es lo prudente. Hay que dejarlo así y anotar la
  discrepancia.

### 4. Los tres textos de la tarjeta · confirmados (sin cambio)

| Dato | Texto | Caracteres | Respaldo de hoy |
|---|---|---|---|
| Mínimo | «Sin mínimo; pagas en USDC (dólar digital)» | 41 | CF «Minimum Investment Amount: not applicable»; KID «Importe mínimo de inversión: no aplicable»; en cadena `minAmount() = 0` |
| Acceso desde España | «Sí: oferta pública en España para particulares; la web de Midas incluye España entre sus países permitidos» | 106 | CF parte B (España y minoristas); aviso 1.0.2 del código de hoy |
| Salida | «Reembolso al emisor cualquier día hábil, con tope diario (25 % según contrato, 15 % según KID); sin reventa» | 107 | KID p. 3 «Puede solicitar el reembolso cualquier Día Hábil» y «No debe presuponer que podrá vender el Producto a nadie distinto del Emisor»; CF «Redemption Gates 25%» |

Están en castellano llano, tienen menos de 120 caracteres y no llevan cifras
inventadas. El mínimo no dice «por token».

## Robinhood · Classic Stock Tokens (sin cambios) · confirmado

- Documentos (09:25:15–09:25:17 UTC), con el mismo SHA-256 que el
  investigador y que el 05/11:
  - KID en inglés: `d744e3ac…`. «Date of Document Production: 1 July 2026»;
    «Entry costs 0.10%» y «Exit costs 0.10%».
  - Descripción de servicios en inglés: `4e3ab0a2…`.
  - Tarifas: `614b0f5b…`. «Robinhood Europe applies a 0.10% currency
    conversion fee for each transaction».
- Web en español (09:25:17 UTC). Dice:
  - «Empieza con tan solo 1 euro»;
  - «más de 2.000 Classic Stock Tokens vinculados a acciones y ETP de EE. UU.»;
  - «desde el lunes a las 2 de la madrugada CET/CEST hasta el sábado a las 2 de
    la madrugada CET/CEST»;
  - «contratos derivados entre tú y Robinhood».

  Enlaza el KID en español y la descripción de servicios en español.
- **KID en español** (09:25:16 UTC, SHA-256 `84f4f0a8…`, el mismo que el
  investigador). Dice «Fecha de producción del documento: 1 de julio de 2026»,
  «clase de riesgo 7» y «Período de mantenimiento recomendado: 1 año». También:
  «Robinhood Europe podrá suspender el cierre de posiciones». La errata que
  señala el investigador es real: «Costes de entrada 0,00 % … 10 EUR», cuando
  el inglés dice 0,10 %. La métrica publicada sale de la tarifa y no cambia. Me
  parece bien añadir este KID a las fuentes de la ficha.
- Descripción de servicios en español (09:25:16 UTC, `75f905ae…`). Dice
  «El token no es transferible ni cedible», «en una proporción de 1:1» y tiene
  un apartado «5. Evaluación de conveniencia».
- Banco de Lituania (09:25:18 UTC): «LB002288, LB002294, LB002341»; licencia
  de intermediación de categoría A, «valid from: 2025-04-03».
- CNMV (09:25:19–09:25:21 UTC): n.º 5299, 21/04/2025. En el programa de
  actividades figuran los «derivados relacionados con valores».
- Advertencias de la CNMV «Robinhood» (09:24:50 UTC): «No hay datos
  disponibles».
- Los avisos y los tres textos de la tarjeta (9, 108 y 107 caracteres) siguen
  respaldados.

## Kraken · xStocks (sin cambios) · confirmado

- Condiciones finales de SPYx (08/05/2026) y JBBBx (03/11/2026), descargadas a
  las 09:25:44 y 09:25:46 UTC, con SHA-256 `280159d4…` y `9ad0819c…`, los
  mismos. Las dos dicen: «Country(ies) of offer(s): The Products will be
  offered in Liechtenstein and Switzerland (only to Swiss Professional
  Investors). The right to offer in other jurisdictions is explicitly
  reserved.».
- ESMA (09:25:49 UTC): el emisor tiene 1.730 documentos y el más reciente es
  del **03/11/2026** (44 ese día). No hay nada posterior. El último suplemento
  es del 29/09/2026 (09:25:52 UTC). **El primer aviso no se puede quitar** y el
  segundo («RWAdar no ha encontrado ningún documento oficial…») sigue vigente.
- Kraken UE en español (09:26:30 UTC; hay que pedir el idioma español, porque
  si no la misma URL sirve el inglés). Dice:
  - «Puedes comenzar con tan solo 1 EUR»;
  - «disponibles para clientes de PEDSL-CY ubicados en la UE que hayan
    completado con éxito la evaluación de idoneidad obligatoria»;
  - «licencia 342/17».

  La versión inglesa (09:25:53 UTC) dice «The issuer of the xStocks is not
  affiliated to the Kraken Group».
- Comisiones en inglés (09:25:54 UTC): «Small instant trades carry a fee of up
  to $2 instead of the 1% fee».
- CySEC (09:26:04 UTC): 342/17, dominio `eu.kraken.com`, España en la lista.
  CNMV (09:25:55 UTC): n.º 4474, desde el 05/01/2018. Pasaportes de la CNMV
  (09:26:06 UTC): «11/05/2026 BACKED ASSETS (JE) LIMITED LIECHTENSTEIN BPWO-80
  08/05/2026».
- Advertencias de la CNMV para «Kraken», «Payward», «Backed» y «xStocks»
  (09:24:52–09:24:58 UTC): «No hay datos disponibles».
- KID en español de SPYx (09:29:28 UTC, SHA-256 `d89ded59…`, el mismo): «Este
  documento tiene fecha 09 nov. 2026», «clase de riesgo 5». La tarjeta no lo
  usa.

## Prosegur Digital Gold (sin cambios) · confirmado

- Condiciones (Playwright, 09:26:43 UTC): «Actualizado el 08/07/2026». Comparé
  mi texto con el del investigador línea a línea: **solo cambia el aviso de
  cookies**. Dicen:
  - «Precio LBMA diario + 4%» y «Precio LBMA diario - 6%»;
  - «en un plazo de 1 a 7 días hábiles aproximadamente»;
  - «inventario segregado de naturaleza fungible»;
  - «EL PRODUCTO TOKEN DE ORO NO ES UN PRODUCTO FINANCIERO»;
  - «SOLO PUEDEN REVENDERSE A PROSEGUR CRYPTO»;
  - pagos «en EUROS para los Clientes residentes en el Espacio Económico
    Europeo».
- Web (09:26:51 UTC): «Compra mínima ✔ 1 gramo», que respalda el mínimo.
- App sin sesión (09:27:14 UTC): «Precio de compra 122.33 €». Coincide con el
  investigador. No va en la tarjeta.
- Transparencia (09:27:07 y 09:27:45 UTC). Dice «Token ↔ bullion reports …
  are available for public download», pero la página no enlaza ningún informe
  (ningún PDF). Sigue diciendo que la red es «Polygon», y el contrato dice
  «Ethereum, estándar ERC-1155». El conflicto de la red sigue.
- CNMV, lista de proveedores de criptoactivos (09:27:53 UTC, PDF creado el
  09/11/2026, SHA-256 `188c6935…`, el mismo): PROSEGUR CUSTODIA DE ACTIVOS
  DIGITALES, desde el 30/06/2026, para recepción y transmisión de órdenes,
  transferencia y custodia. El CSV de ESMA (09:27:54 UTC) dice lo mismo.
- Advertencias de la CNMV para «Prosegur», «Prosegur Crypto» y «Prosegur
  Custodia» (09:25:03–09:25:06 UTC): «No hay datos disponibles».
- Los textos de la tarjeta (53, 89 y 115 caracteres) siguen respaldados. Una
  nota que no obliga: el contrato (§2.4) deja cambiar 1.000 tokens (1 kg) por
  el lingote físico, que se recoge en la Comunidad de Madrid. Es otra salida
  con el mismo proveedor, así que «Solo puedes revenderlo a Prosegur» sigue
  siendo fiel a la cláusula «SOLO PUEDEN REVENDERSE A PROSEGUR CRYPTO». Se
  puede mencionar en la ficha completa si se quiere.

## Datos personales en las copias del grupo (punto 6) · rechazado

Los expedientes, el resumen y el inventario del grupo no tienen nombres de
personas. Pero **siete copias de texto** de
`grupos/acciones-oro-tesoro/fuentes/` (fuera de `crudo/`) llevan nombres y
apellidos de personas físicas: administradores, consejeros y auditores, tal
como salen en los documentos de los emisores. Son estas:

- `mtbill-final-terms-20260717.txt` (resumen anexo: administración, socios y
  auditores);
- `backed-folleto-base-2026-05-08.txt`;
- `backed-ft-SPYx.txt`, `backed-ft-AAPLx.txt`, `backed-ft-NVDAx.txt`,
  `backed-ft-JBBBx.txt` y `backed-ft-LITEx-159.txt` (apartado «Key managing
  directors» del resumen).

Hoy esa carpeta está fuera de Git (`.git/info/exclude`), así que no se ha
publicado nada. → **Corrección obligatoria 2.**

Mis copias de `fuentes/acciones-oro-tesoro/` son solo extractos y no tienen
nombres de personas. Lo comprobé con una búsqueda.

## Correcciones obligatorias

1. **mTBILL, explicación del acceso.** Ningún texto público (ficha, referencia
   de «Acceso desde España», resumen del día) puede usar «lista blanca
   desactivada», «sin lista blanca» ni `greenlistEnabled() = false` como prueba
   de que un particular puede comprar. El KID (p. 3) exige el alta y que el
   emisor incluya tu wallet en su lista de direcciones autorizadas. Si se añade
   una referencia de acceso del 10/11, que se apoye solo en esto:
   - las Condiciones Finales (oferta pública en España, apta para minoristas);
   - el pasaporte BPWO-84 en la CNMV;
   - el código de la web (España entre los países permitidos y, para mTBILL,
     sin la ventana de inversor cualificado).

   Y que diga que el emisor no lo afirma expresamente para particulares
   españoles. El texto de la tarjeta para «Acceso desde España» no cambia.
2. **Copias del grupo.** Antes de pasar `grupos/acciones-oro-tesoro/fuentes/`
   a Git, hay que mover a `crudo/` (fuera de Git) los siete archivos de texto de
   arriba, o cambiarlos por extractos sin nombres de personas.

## Notas que no obligan

- mTBILL: anotar en el expediente la discrepancia sobre la transmisión. La web
  dice «Fully transferable token, no restrictions.» y el KID solo permite
  transmitir a wallets autorizadas. El aviso publicado no cambia.
- Robinhood: añadir el KID en español a las fuentes de la ficha, con la errata
  del coste de entrada anotada.
- La búsqueda de advertencias de la CNMV que usamos (`tipo=1`) es la lista de
  «No autorizadas». Con `tipo=2` y `tipo=3` la web redirige (302), y `tipo=4`
  devuelve la misma lista. No hay otra lista pública que se pueda consultar
  así.

## Bloqueos de esta revisión

1. `midas.app`, `midas.app/mtbill` y la página legal de mTBILL en
   `docs.midas.app` dan 403 (Cloudflare) a las 09:23 UTC. Sin APY y sin poder
   ver el aviso en pantalla: lo leí en el código servido. Tampoco puedo
   confirmar que la página legal enlace hoy estos mismos PDF. Los descargué de
   sus URL de GitBook y su huella es la de siempre.
2. Que se acepte el alta de un residente en España solo se puede comprobar
   haciendo KYC, y eso no se hace.
3. `assets.backed.fi` no se volvió a intentar: el investigador la encontró
   bloqueada por país y no se sortean bloqueos.
