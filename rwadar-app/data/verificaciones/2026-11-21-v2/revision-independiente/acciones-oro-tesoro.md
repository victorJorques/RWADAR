# Revisión independiente · grupo acciones-oro-tesoro · 21/11/2026

Revisé entre las 18:01 y las 18:13 UTC, abriendo yo mismo cada fuente. No
preparé los expedientes y no los he tocado. Copias en
`revision-independiente/fuentes/acciones-oro-tesoro/` (lo que lleva nombres de
personas o pesa mucho, en `crudo/`), con su inventario en
`inventario-revision.json`.

## En pocas palabras

- **Las cuatro siguen abiertas hoy y un particular en España puede comprar en
  las cuatro.** Lo comprobé en la fuente de cada una.
- **mTBILL, Robinhood y Prosegur: «mantener» es correcto.** Mismos documentos,
  mismas cifras, mismos registros.
- **Kraken xStocks: el cambio principal no se sostiene para España y lo
  rechazo.** El emisor lanzó el 11/11 más de 200 empresas de Reino Unido y la UE,
  pero la página de Kraken UE, que es quien vende a los clientes en España, hoy
  sigue diciendo solo «acciones y ETF de EE. UU.». Escribir en la tarjeta que
  un cliente en España puede comprar acciones de Reino Unido y la UE no está
  respaldado. La tarjeta publicada sigue siendo cierta: se queda como está,
  re-fechada al 21/11.
- **Para el lunes:** la lista de referencias con fechas viejas que propone el
  investigador está incompleta; abajo la completo.
- En las copias del grupo hay PDF y una página con nombres de personas. Se
  quedan en el disco: el `.gitignore` del ciclo ya deja fuera de Git los PDF,
  los HTML y `crudo/`. A Git no va nada con nombres.

Veredicto global: **aprobado con cambios** (las correcciones obligatorias van al
final).

| Ficha | Lo que propone el investigador | Mi veredicto |
|---|---|---|
| Kraken xStocks | actualizar (Reino Unido y UE en título, resumen, salida y avisos) | **Rechazado el cambio de alcance**; se mantiene lo publicado. Confirmados el «Sí» de España, el aviso de dividendos y todo lo demás |
| mTBILL | mantener | Confirmado |
| Robinhood | mantener | Confirmado |
| Prosegur Digital Gold | mantener | Confirmado |

## 1. Kraken xStocks

### 1.1 Título y resumen con «más de 200 empresas de Reino Unido y la UE» · RECHAZADO

Lo que sí es verdad:

- Anuncio del emisor, https://xstocks.fi/us/news/xstocks-brings-200-of-the-uk-and-eus-largest-companies-onchain
  (18:02:28 UTC, HTTP 200): «November 11, 2026 … xStocks has launched its first
  regional markets, bringing tokenized equities for 200+ of the largest UK and
  EU-listed companies» y «This new batch of xStocks are available on Kraken,
  Kraken Pro … trading follows local market hours at launch. xStocks are not
  available to investors in the UK or the US.»
- Soporte de Kraken en español, https://support.kraken.com/es-es/articles/xstocks-availability
  (18:07:45 UTC): «Última actualización: 11 de noviembre de 2026 … También
  ofrecemos renta variable tokenizada de mercados no estadounidenses, como el
  Reino Unido y la UE.» La lista incluye ACS, Aena, Amadeus, HSBC o Siemens.
- La API pública de Kraken (https://api.kraken.com/0/public/Assets?aclass=tokenized_asset,
  18:06:08 UTC) ya tiene dados de alta SAPx, AENAx, ACS.ESx, HSBAx o RR.GBx.

Lo que **no** está respaldado, y es lo que importa para la tarjeta:

- La página de Kraken UE, https://eu.kraken.com/xstocks (18:04:22 y 18:05:34
  UTC), que es la URL de la tarjeta y la de quien vende en España (Payward
  Europe Digital Solutions (CY)), dice hoy: «Kraken ofrece acceso a más de 1.000
  acciones y ETF de EE. UU.», «Los xStocks te permiten acceder a los principales
  ETF y acciones de EE.UU.» y «Acciones tokenizadas. Opera 24/5». No nombra
  Reino Unido ni la UE.
- El soporte es común a todo Kraken (su pie de página habla de la filial de
  Bermudas) y su lista no separa por región. En la parte de «Requisitos para los
  clientes del EEE» no dice qué valores pueden comprar.
- La API de pares negociables (`AssetPairs?aclass_base=tokenized_asset`, con y
  sin `country_code=ES`, 18:06:00 UTC) devuelve 356 pares y **ninguno** es de
  Reino Unido o la UE (sí TSLAx o AAPLx). No es prueba de que no se vendan (en
  la app se compran por «Convertir»), pero tampoco de que sí.
- En ESMA no hay condiciones finales del emisor fechadas el 11/11 (consulta de
  las 18:06:40 UTC: 58 desde el 15/10, la última del 19/11). Las de Reino Unido
  (p. ej. HSBC) no aparecen.
- El propio investigador lo dejó como bloqueo: «No se ha comprobado valor a
  valor qué puede comprar un cliente de la UE».

Con la regla «ante la duda, rechazado», no se puede decir a un cliente en España
que puede comprar acciones de Reino Unido o la UE en Kraken UE. **Corrección:**
mantener el título y el resumen publicados. Si se quiere contar la novedad, solo
en la ficha completa y así (opcional): «El 11/11/2026 el emisor lanzó xStocks de
más de 200 empresas de Reino Unido y la UE; la web de Kraken UE solo habla de
acciones y ETF de EE. UU. (21/11) y RWAdar no ha confirmado que se vendan a
clientes en España.»

### 1.2 Métrica «Salida», aviso nuevo de horario y «salida» de Lo esencial · RECHAZADO

El dato es real a nivel global (preguntas frecuentes de Kraken,
https://support.kraken.com/articles/xstocks-faq, «Last updated: November 11,
2026», 18:02:52 UTC: «UK-listed and EU-listed xStocks trade during their
exchange’s hours on Kraken at launch»), pero depende del punto 1.1. Para un
cliente de Kraken UE la página dice «En Kraken, los xStocks se operan 24/5».

**Corrección:** dejar lo publicado: «Salida: Venta a Kraken en USD (24/5) o
retirada a wallet»; sin el aviso «Las acciones de Reino Unido y la UE solo se
pueden comprar y vender en el horario de su bolsa»; y en Lo esencial la salida
publicada, «Vendes a Kraken en USD, con diferencial, 24/5, o retiras el token a
tu wallet; sin plazo fijo» (93 caracteres). Tampoco cambiar «Qué se adquiere»
en la documentación larga.

### 1.3 Aviso de dividendos sin «en EE. UU.» · CONFIRMADO (no crítico)

Preguntas frecuentes (18:02:52 UTC): «Net Dividend (after applicable
withholding tax, which is 30% for US-listed and regional-listed xStocks)». Las
dos redacciones son ciertas; si el título sigue siendo de EE. UU., puede quedarse
la publicada.

### 1.4 Acceso desde España en Lo esencial · CONFIRMADO

«Sí, tras alta y test de Kraken UE; ojo: las condiciones finales del emisor no
incluyen España» (93 caracteres, castellano llano). Respaldo:

- https://eu.kraken.com/xstocks (18:05:34 UTC): «Los xStocks están disponibles
  para clientes de PEDSL-CY ubicados en la UE que hayan completado con éxito la
  evaluación de idoneidad obligatoria o que sean inversores profesionales».
- Soporte (18:07:45 UTC): «Si resides en el EEE, debes completar y superar un
  cuestionario antes de acceder al trading de xStocks».
- Condiciones finales: leí hoy las de Zalando (CH1588665997, SHA-256
  4b990f07…) y Commerzbank (CH1588665898, c2fdf05c…), del 15/10, a las 18:06:56
  UTC: «The Products will be offered in Liechtenstein and Switzerland (only to
  Swiss Professional Investors). The right to offer in other jurisdictions is
  explicitly reserved.» España solo está entre los países a los que se notificó
  el folleto. ESMA: 58 condiciones finales desde el 15/10 (44 del 03/11, 12 del
  15/10, una del 10/11 y una del 19/11); ninguna nueva desde el 20/11. Coincide
  con el investigador.

### 1.5 Resto de la tarjeta · CONFIRMADO

- Mínimo: «una inversión de tan solo 1 EUR» (eu.kraken.com, 18:05:34 UTC).
- CNMV n.º 4474, Payward Europe Digital Solutions (CY), libre prestación,
  registro 05/01/2018 (18:08:47 UTC). CySEC: «Licence Number : 342/17»
  (18:08:29 UTC).
- Folleto: CNMV, pasaportes, «11/05/2026 BACKED ASSETS (JE) LIMITED
  LIECHTENSTEIN BPWO-80 08/05/2026» (18:12:52 UTC).
- Comisiones: https://www.kraken.com/features/fee-schedule (18:09:06 UTC): «The
  standard 1% instant buy/sell trading fee applies when purchasing xStocks using
  other assets … a spread may be included» y «Small instant trades carry a fee of
  up to $2 instead of the 1% fee».
- Sin advertencias de la CNMV para «Kraken» (18:10:45 UTC, «No hay datos
  disponibles»; el control «Gemini» devuelve GEMINI LTD FX y GEMINI OPTION LTD).
- La web de Kraken UE sigue diciendo «El emisor de xStocks no está afiliado al
  Grupo Kraken», así que el aviso de «mismo grupo» sigue vigente.

## 2. mTBILL · mantener · CONFIRMADO

- Condiciones Finales (18:09:23 UTC): SHA-256 b1e58001…, el mismo que el
  vigía y que el investigador. Leído: oferta pública en «Ireland, Malta, Austria,
  Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands,
  Sweden, Portugal, Germany»; «Offer Period: until end of validity of the Base
  Prospectus», que acaba «at the end of 17 July 2027»; «Minimum Investment
  Amount: not applicable»; «Target market … retail clients»; «Redemption Gates
  25%», «Holdback Percentage up to 5%», «Instant Subscription Fee up to 0.2%»,
  «Redemption Fees up to 0.05%», «Instant Redemption Fee 0.07%».
- KID en español (18:09:23 UTC): SHA-256 6c228709…, igual. «no reembolsará más
  del 15 %», «podrá retenerse hasta el 50 %», «No cobramos comisión de entrada»,
  «0,07 % … solo se aplica al reembolso inmediato», riesgo 7 de 7. **El conflicto
  sigue: `fuentes_en_conflicto` correcto.**
- Oráculo (eth_call a 0x056339C0…, 18:09:49 UTC): ronda 498, 1,07890125 USD,
  20/11/2026 11:41:35 UTC; sin ronda nueva. Con la ronda 475 (16/10/2026
  13:47:47 UTC, 1,0753419 USD): 34,91 días, **3,46 % anual** simple (3,52 %
  capitalizando). Coincide con la tarjeta y el vigía.
- ESMA (18:09:58 UTC): última, FTWS-1420 del 17/07/2026, con España. CNMV
  pasaportes: «17/07/2026 Midas Software GmbH LIECHTENSTEIN BPWO-84».
- midas.app/mtbill: 403 (un solo intento, 18:10:12 UTC), igual que el
  investigador.
- Los tres textos de Lo esencial no cambian y siguen respaldados (el de salida,
  107 caracteres, con «25 % según contrato, 15 % según KID»).

## 3. Robinhood Classic Stock Tokens · mantener · CONFIRMADO

- https://robinhood.com/eu/es/invest (18:10:20 UTC): «Empieza con tan solo 1
  euro», «Explora más de 2.000 Classic Stock Tokens vinculados a acciones y ETP
  de EE. UU.», «Una comisión por cambio de divisas del 0,1 % cubre todo»,
  «desde el lunes a las 2 de la madrugada CET/CEST hasta el sábado a las 2»,
  autorizada por el Banco de Lituania.
- KID en español (18:10:19 UTC): SHA-256 84f4f0a8…, igual que el expediente:
  «clase de riesgo 7», «Período de mantenimiento recomendado: 1 año»,
  «instrumento financiero complejo».
- CNMV n.º 5299, Robinhood Europe, UAB, libre prestación, registro 21/04/2025
  (18:08:47 UTC). Sin advertencias de la CNMV (18:10:45 UTC).

## 4. Prosegur Digital Gold · mantener · CONFIRMADO

- https://www.prosegurcrypto.com/digital-gold (18:11:12 UTC): «Compra mínima ✔
  1 gramo».
- Contrato, https://app.prosegurdigitalgold.com/#/terms-service (18:11:30 UTC):
  «Actualizado el 08/07/2026»; «Precio LBMA diario + 4%» / «Precio LBMA diario -
  6%»; recompra «en un plazo de 1 a 7 días hábiles aproximadamente»; pagos «en
  EUROS para los Clientes residentes en el Espacio Económico Europeo»; «no
  constituye … instrumento financiero regulado».
- App (18:11:43 UTC): «Precio de compra 107.89 € · Emitida · Comprar». Sigue
  vendiendo (el precio no va en la tarjeta).
- ESMA, registro de proveedores de criptoactivos (18:11:59 UTC): PROSEGUR
  CUSTODIA DE ACTIVOS DIGITALES S.L.U., CNMV, 30/06/2026, custodia (a) y
  transferencia (g). Sin advertencias de la CNMV para «Prosegur» (18:10:45 UTC).

## 5. Lo re-fechado con el vigía (muestreo)

Hay 30 datos con `segunVigia` en el grupo. Comprobé con un script que los 27
que llevan huella están en `vigia.json` como «no cambia», con la misma hora.
Los otros 3 (mTBILL, `avisosConFecha` 0, 1 y 6) no llevan huella, pero son las
dos cifras del oráculo que el vigía dio como «no cambia»: válidos; conviene
añadirles la huella (f38b598a… y 226aa2da…).

Abrí hoy estos y coinciden:

| Dato | Vigía | Mi lectura |
|---|---|---|
| Folleto base de Backed (MFSA) | 47be9272… | 47be9272… (18:09:14 UTC) |
| Condiciones finales LITEx | 85b56d11… | 85b56d11… (18:09:14 UTC) |
| KID de Robinhood (inglés) | d744e3ac… | d744e3ac… (18:10:11 UTC) |
| Tabla de comisiones de Robinhood | 614b0f5b… | 614b0f5b… (18:10:11 UTC) |
| Oráculo mTBILL | 1,0789 USD · 3,46 % | 1,07890125 USD · 3,46 % (18:09:49 UTC) |
| CNMV «Kraken» / «Prosegur» | sin advertencias | sin advertencias (18:10:45 UTC) |

En las búsquedas de la CNMV la huella de la página cambia en cada visita (el
HTML es dinámico); comprobé que el resultado es el mismo, y que la copia del
vigía dice «No hay datos disponibles».

## 6. Nombres de personas y datos personales

- Expedientes, resumen e inventario del grupo: sin nombres de personas ni datos
  personales.
- **Copias del grupo:** fuera de `crudo/` hay archivos con nombres de personas:
  los 7 `fuentes/backed-ft-*.pdf` y `fuentes/mtbill-ft.pdf` (nombres de
  directivos y firmantes) y `fuentes/xstocks-fi-us.html` (nombre y cargo de un
  directivo citado). Comprobado con `git check-ignore` y `git ls-files`: el
  `.gitignore` del ciclo (`grupos/**/*.pdf`, `grupos/**/*.html`,
  `grupos/**/crudo/`) ya los deja fuera de Git, y en el commit `17e02b9d` del
  grupo solo entraron 5 JSON de ESMA, el CSV de ESMA, el resumen y el
  inventario, sin nombres. Se quedan en el disco; no hay que hacer nada más.
- Problema anterior, no de hoy: los `backed-ft-*.txt` que entraron en Git el
  20/11 (`2026-11-20-v2/grupos/acciones-oro-tesoro/fuentes/`) llevan nombres de
  directivos del emisor. Que lo decida el coordinador.
- Mis copias: la página del anuncio con el nombre está en `crudo/`; fuera solo
  dejé un extracto sin nombres.

## 7. Fechas viejas en las fichas (para la reunión del lunes)

El investigador tiene razón en que las tarjetas no llevan fechas pasadas, pero su
lista de la ficha completa está **incompleta**. En `documentacion-ofertas.json`
de lo publicado también están:

- **mTBILL:** «Acceso desde España · consulta 01/11/2026» y «Países de oferta
  según la web de Midas · consulta 05/11/2026». Las dos dependen de midas.app,
  que hoy da 403, así que no se pueden re-fechar: hay que retirarlas. Las
  Condiciones Finales ya cubren España.
- **Prosegur:** además de las del 30/09 y las del 22/10, «Costes publicados de
  compra y venta» y «Salida y plazo contractual publicados» (consulta 23/10), y
  nueve con «· consulta 01/11/2026» o «· consulta 02/11/2026», incluida
  **«Estado de la oferta · consulta 01/11/2026»**, que es justo lo que preocupa a
  Víctor. Hay que re-fecharlas con lo leído hoy (contrato 08/07/2026, web y app a
  las 18:11 UTC) o retirarlas si repiten otras.
- **Kraken:** «Situación del emisor» (consulta 03/11) se puede re-fechar al 21/11
  porque el folleto y el suplemento tienen la misma huella. En «Mínimo de
  inversión», «Acceso desde España» y «Salida», el texto de alcance aún dice
  «Página de xStocks de Kraken UE consultada el 03/11/2026»: quitar esa frase.
- **Robinhood:** las diez «· consulta 01/11/2026» (la lista del investigador está
  bien).

## 8. Bloqueos

- midas.app/mtbill: 403 (un intento, 18:10:12 UTC); no se insistió.
- No hay ninguna fuente primaria de Kraken UE que diga si sus clientes pueden
  comprar las xStocks de Reino Unido y la UE. Por eso se rechaza el punto 1.1.
- No abrí assets.backed.fi («Access Restricted» según el investigador) ni
  repetí la API de la FMA de Liechtenstein; no hacen falta para la tarjeta.
- Una prueba de navegador que abría las preguntas de eu.kraken.com acabó en otra
  página (`crudo/kraken-eu-xstocks-faq-render.json`, sin valor); las preguntas
  las leí en el HTML de la página (18:05:34 UTC).

## Correcciones obligatorias

1. **Kraken xStocks:** no aplicar el cambio de alcance. Mantener el título, el
   resumen, la métrica «Salida», la salida de Lo esencial y «Qué se adquiere»
   como están publicados, sin el aviso nuevo de horario. Re-fechar al 21/11 con
   las lecturas de hoy (eu.kraken.com 18:05:34 UTC; CNMV 4474 y 5299 18:08:47;
   CySEC 18:08:29; comisiones 18:09:06). La decisión pasa de «actualizar» a
   «mantener» (solo cambia la redacción de España en Lo esencial y, si se quiere,
   el aviso de dividendos).
2. **Fechas viejas:** completar la lista del coordinador con lo del punto 7
   (mTBILL 01/11 y 05/11, que hay que retirar; Prosegur 23/10, 01/11 y 02/11,
   incluido «Estado de la oferta»; Kraken «Situación del emisor» y los textos
   «consultada el 03/11/2026»).
3. Menor: añadir la huella del vigía a mTBILL `avisosConFecha` 0, 1 y 6.
4. Fuera de este ciclo (anterior): los `backed-ft-*.txt` del 20/11 que están
   en Git llevan nombres de directivos; que lo decida el coordinador.
