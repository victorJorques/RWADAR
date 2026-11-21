# Auditoría independiente · acciones, oro y letras · 21/11/2026

Ámbito: Robinhood Classic Stock Tokens, Kraken xStocks, Prosegur Digital Gold y
mTBILL. Lo que se va a publicar = la entrega `2026-11-20.2` (escaparate y
documentación) + los cambios de `DECISIONES-COORDINADOR.md` §2 y §4 con las
correcciones de `revision-independiente/acciones-oro-tesoro.md`.

Todo abierto hoy entre las 20:14:57 y las 20:25:48 UTC, con `curl` y su agente
por defecto o con el navegador sin trucos (solo las tres páginas de Prosegur que
se pintan con JavaScript). Sin cuentas, sin eludir nada; un solo intento en las
webs de Midas que dan 403. Copias y registro de horas y SHA-256 en
`/tmp/auditoria-2026-11-21/acciones-oro-tesoro/` (fuera del repositorio; la
página comercial de Prosegur trae nombres de personas en recortes de prensa y no
se cita aquí).

## En pocas palabras

- **Las cuatro siguen abiertas hoy y un particular en España puede contratar en
  las cuatro.** Robinhood (web en español y nota oficial: «eligible customers in
  every country in the EU and EEA»), Kraken UE («disponibles para clientes de
  PEDSL-CY ubicados en la UE que hayan completado con éxito la evaluación de
  idoneidad»), Prosegur (la app vende: «Precio de compra 107.88 € · Emitida ·
  Comprar»; contrato en euros para residentes del EEE) y mTBILL (Condiciones
  Finales con España entre los 14 países de oferta pública, hasta el 17/07/2027).
- **Todas las cifras de las tarjetas aguantan.** Recalculé la rentabilidad de
  mTBILL en cadena: ronda 498 (1,07890125 USD, 20/11/2026 11:41:35 UTC) frente a
  la 475 (1,0753419 USD, 16/10/2026): 34,91 días, **3,46 %** anual simple. Los 12
  PDF tienen el mismo SHA-256 que el vigía, los expedientes o el revisor.
- Sin advertencias de la CNMV para ninguno de los 9 nombres (control «Gemini»
  con resultados), con las mismas huellas que el vigía.
- **Lo que hay que arreglar antes de publicar (obligatorio):**
  1. **Kraken:** el texto de España que el revisor dio por bueno para «Lo
     esencial» («Sí, tras alta y test de Kraken UE; ojo: las condiciones finales
     del emisor no incluyen España») **apaga el «Sí» de España en la web y la
     app**: la ficha pasaría a decir «Sin comprobar si se puede contratar desde
     España». Lo comprobé ejecutando `resumenOferta` (abajo).
  2. **mTBILL:** la casilla de Transparencia «La entidad que la ofrece está
     autorizada…» seguirá diciendo «consultada el 10/11/2026». El motor no la
     re-fecha porque nadie volvió a consultar BaFin hoy. La consulté yo
     (20:17:55 UTC): dice lo mismo.
  3. **Fechas viejas en la ficha completa** que el motor no cambia solo: los
     textos «… consultada el 03/11/2026» de Kraken, las fechas del dato
     «01/11/2026» de páginas web sin fecha (Robinhood y Prosegur) y las
     referencias antiguas de Prosegur, entre ellas dos que contradicen la tarjeta
     («Liquidación … Menos de 24 horas»).

## 1. Kraken xStocks

Abierto: eu.kraken.com/xstocks (es 20:18:43, en 20:18:44), riesgo (20:18:44),
comisiones en inglés y español (20:18:44–45), FAQ y disponibilidad (20:18:45–46),
CNMV 4474 y vista 17 (20:18:47–50), CySEC (20:18:53), pasaportes CNMV (20:19:04),
ESMA (20:19:05–06), anuncio del emisor y su web (20:19:07–08), folleto base,
segundo suplemento y condiciones finales LITEx, ANTx, Zalando y Xetra-Gold.

| Dato visible | Hoy en la fuente | Resultado |
|---|---|---|
| Título y resumen («más de 1.000 acciones y ETF de EE. UU.», «grupo de Kraken») | eu.kraken.com: «Kraken ofrece acceso a más de 1.000 acciones y ETF de EE. UU.»; suplemento 29/09: «both group companies of the Issuer» | Bien. Coincido con el revisor: la web de Kraken UE no habla de Reino Unido ni de la UE |
| Mínimo «Desde 1 €» | «Puedes comenzar con tan solo 1 EUR» | Bien |
| Qué compras | Riesgo: «xStocks are debt securities in tokenised format» | Bien |
| Vendedor y supervisor | CySEC «Licence Number : 342/17»; CNMV «4474 · 05/01/2018» | Bien |
| Folleto | CNMV: «11/05/2026 · BACKED ASSETS (JE) LIMITED · LIECHTENSTEIN · BPWO-80 · 08/05/2026 · Sí»; ESMA: último suplemento SUPP-68 del 29/09 | Bien |
| Condiciones finales | ESMA: 58 desde el 15/10 (12 + 44 + 1 + 1), la última del 19/11, ninguna nueva hoy. Leídas ANTx (116a61b3…), LITEx (85b56d11…), Zalando (4b990f07…) y Xetra-Gold (5297cd90…): «The Products will be offered in Liechtenstein and Switzerland (only to Swiss Professional Investors)» | Bien |
| Compra con euros | «The standard 1% instant buy/sell trading fee applies when purchasing xStocks using other assets»; «Small instant trades carry a fee of up to $2 instead of the 1% fee»; «a spread may be included» | Bien |
| Salida | «En Kraken, los xStocks se operan 24/5»; «Vender … de nuevo a USD»; retirada a monedero | Bien |
| 10 avisos | Riesgo: «xStocks are complex products», «YOU CAN LOSE YOUR ENTIRE INVESTMENT»; folleto: «not profitable», «sustain any loss»; web: «no está afiliado al Grupo Kraken»; FAQ: «30% for US-listed and regional-listed xStocks» | Bien (el de dividendos, con o sin «en EE. UU.», es cierto) |
| 13 enlaces de la ficha y el botón | Todos 200 | Bien |

**Obligatorio 1 · España en «Lo esencial».** `resumenOferta` solo da «Sí» si el
texto no contiene «no » y sí «disponible», «acceso», «admit» o «permit». Con el
texto del revisor, ejecutado con los datos publicados re-fechados al 21/11:

```
acceso: Sin comprobar si se puede contratar desde España  (estado sin_comprobar)
```

y la casilla «Se contrata hoy desde España» pasaría a «✗ No · No consta en la
fuente que se contrate desde España», que es falso. Con el valor publicado o con
este otro, sale «Disponible desde España según la fuente» (`si`):

- dejar el publicado: «Según Kraken UE, disponible para sus clientes en la UE que
  superen su evaluación o sean inversores profesionales»; o
- si se quiere el «Sí» delante: «Sí, disponible tras alta y test de Kraken UE; las
  condiciones finales del emisor solo citan Liechtenstein y Suiza» (113
  caracteres; el aviso ya explica lo de España).

Lo mismo pasaría con los textos «Sí, …» que proponen los expedientes de
Robinhood y Prosegur (los probé: los dos salen `sin_comprobar`). §2 dice que no
cambian; que nadie los aplique.

**Obligatorio 3 · fechas viejas de Kraken.** Las referencias «Mínimo de
inversión», «Acceso desde España» y «Salida» llevan en su nota «Página de
xStocks de Kraken UE consultada el 03/11/2026». El motor solo cambia el «Comprobado
de nuevo en la fuente el …». Quitar esa frase (con `notaCambia`). Y re-fechar al
21/11 «Registro del vendedor», «Licencia del vendedor», «Comisión con euros» y
«Situación del emisor» (todas del 03/11), cambiando también sus notas «… consultado
el 03/11/2026». Las cuatro fuentes dicen hoy lo mismo (arriba).

**Recomendado.** La referencia «Dividendos» sigue diciendo «… del 30 % en
EE. UU.». Si el aviso pierde «en EE. UU.», que la referencia también:
«No se cobran: se suman al saldo, netos de una retención del 30 %».

## 2. Robinhood Classic Stock Tokens

Abierto: los 5 PDF (KID en inglés y español, comisiones, descripción de
servicios en inglés y español, 20:14:58–59, mismos SHA-256), robinhood.com/eu/es
y /en (20:16:46–47), CNMV 5299 y vista 17 (20:16:47–49), Banco de Lituania
(20:16:51), nota oficial del 22/06/2026 (20:16:52), ESMA y CNMV de criptoactivos.

- Título, resumen, las 6 métricas y los 7 avisos: **bien**. «Empieza con tan solo
  1 euro»; «más de 2.000 Classic Stock Tokens vinculados a acciones y ETP de
  EE. UU.»; «Una comisión por cambio de divisas del 0,1 % cubre todo»; «Compra y
  vende … 24/5»; KID: «clase de riesgo 7», «Período de mantenimiento recomendado:
  1 año», «instrumento financiero complejo», «podrá suspender el cierre de
  posiciones»; CNMV «5299 · 21/04/2025» con derivados (apartado 4); Banco de
  Lituania LB002288, LB002294, LB002341.
- Acceso desde España: la nota oficial dice «eligible customers in every country
  in the EU and EEA* can access more than 2,000 Classic Stock Tokens».
- Las diez referencias «· consulta 01/11/2026»: **las diez citas siguen hoy en su
  fuente** (comprobado frase a frase). Se pueden re-fechar al 21/11; mejor aún,
  quitar las que repiten «Mínimo de inversión», «Acceso desde España» y «Salida»
  del 20/11.

**Obligatorio 3 · fecha del dato.** «Mínimo de inversión» (la que se queda) lleva
«Dato fechado: 01/11/2026», pero la página de Robinhood no tiene fecha: es el día
de la primera consulta. El motor re-fecha la consulta, no el dato. Cambiar a «Sin
fecha publicada» (`fechaDato` nulo con `tarjetaFecha`). Lo mismo en «Qué se
adquiere» y «Precio» (página web) si se re-fechan.

**Recomendado.** La nota de «Comisiones · consulta 01/11» dice «KID: entrada
0,10 %». Es así en el KID en inglés; el KID en español dice «Costes de entrada
0,00 %» (errata suya: el mismo cuadro cobra 10 EUR). Añadir «el KID en español
dice 0,00 % (errata)».

## 3. Prosegur Digital Gold

Abierto con el navegador: página comercial (20:20:35), contrato (20:20:55),
transparencia (20:21:07) y app (20:21:19). Con `curl`: transparencia (20:22:02),
CSV de ESMA (20:22:11), lista de la CNMV (20:22:11, mismo SHA-256 0dea9e14…).

- Título, resumen, las 6 métricas y los 6 avisos: **bien**. «Compra mínima ✔ 1
  gramo»; «Actualizado el 08/07/2026»; «Precio LBMA diario + 4%» / «Precio LBMA
  diario - 6%» (ida y vuelta: 1 − 0,94/1,04 = 9,6 %, «cerca de un 10 %»);
  «en un plazo de 1 a 7 días hábiles aproximadamente»; «suspender temporalmente
  las operaciones de recompra»; «SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA
  SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO»; «inventario segregado de
  naturaleza fungible»; ESMA: custodia, recepción y transmisión de órdenes y
  transferencia, 30/06/2026.
- Sigue abierta: «Precio de compra 107.88 € · Emitida · Comprar».

**Obligatorio 3 · referencias viejas.** Quedan 21 con consulta del 30/09 (5),
22/10 (5), 23/10 (2), 01/11 (2) o 02/11 (7). Las citas del contrato y de la web siguen hoy (comprobadas
una a una), así que se pueden re-fechar, pero:

- «Estado de la oferta · consulta 01/11/2026» → re-fechar con la app de hoy:
  «Precio de compra 107,88 € · Emitida · Comprar (app); «Empieza hoy mismo»
  (web)», dato y consulta del 21/11/2026.
- «Liquidación publicada» y «Liquidación publicada · 22/10/2026» («Menos de 24
  horas según el proveedor»): la web lo sigue diciendo, pero contradice la
  tarjeta y el contrato (1 a 7 días hábiles). **Quitarlas**, no re-fecharlas.
- «Auditorías publicadas» (×2): la web dice «Mensuales y certificadas» y la
  página de transparencia promete informes «available for public download», pero
  hoy no enlaza ninguno. Quitarlas o añadir «la web no enlaza ningún informe
  (21/11/2026)».
- «Unidad descrita», «Compra mínima publicada», «Custodia publicada» y «Moneda»
  (30/09 y 22/10): repiten lo que ya está; quitarlas.
- «Mínimo de inversión» (la del 20/11) lleva «Dato fechado: 01/11/2026» y la web
  no tiene fecha: «Sin fecha publicada».

**Recomendado.**
- Transparencia y aviso: «solo para custodiar y transferir criptoactivos» omite
  la recepción y transmisión de órdenes, que la propia fuente de la casilla
  nombra. Mejor: «Prosegur Crypto figura en la CNMV solo para custodiar, tramitar
  órdenes y transferir criptoactivos; su contrato dice que este oro no está
  supervisado.»
- Los avisos «Comprar y vender cuesta en total unos 10 puntos…» y «Si el oro no
  se mueve, comprar y revender te cuesta cerca de un 10 %…» dicen lo mismo:
  dejar uno.

## 4. mTBILL

Abierto: Condiciones Finales y KID en español (20:14:57, b1e58001… y
6c228709…), oráculo en cadena (20:15:35, bloque 26.465.804), ESMA por ISIN y por
emisor (20:15:50–51), pasaportes de la CNMV (20:15:53), BaFin (20:17:55).
midas.app/mtbill, la página de documentación y `llms-full.txt`: **403** a las
20:15:50 (un intento cada una).

- Resumen, las 8 métricas y los 7 avisos: **bien**. «Countr(y)(ies) Where the
  Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium,
  Luxembourg, France, Italy, Spain, …»; «Offer Period until end of validity of
  the Base Prospectus»; «Minimum Investment Amount not applicable»; «retail
  clients»; 25 % / hasta 5 % / hasta 0,2 % / hasta 0,05 % / 0,07 %; KID: «no
  reembolsará más del 15 %», «hasta el 50 %», «No cobramos comisión de entrada»,
  «clase de riesgo 7»; «deficit not covered by equity of EUR 5’778’815.22»;
  «two framework loans granted by the parent company»; «NOT SUPERVISED OR
  APPROVED BY THE LIECHTENSTEIN FINANCIAL MARKET AUTHORITY»; «no established
  trading market». ESMA: 3 documentos del ISIN (el último FTWS-1420, con SPAIN) y
  41 del emisor; CNMV: BPWO-84 notificado el 17/07/2026. El conflicto de
  reembolso sigue: `fuentes_en_conflicto` correcto.
- Las 8 referencias viejas que se retiran (§2 y expediente) dependen de midas.app,
  que hoy da 403: no se pueden re-fechar; retirarlas es lo correcto.

**Obligatorio 2 · Transparencia del 10/11.** La casilla «La entidad que la
ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV» cita
BaFin «consultada el 10/11/2026». Simulé `despues.mjs` con el expediente de hoy:
es la única de las ocho casillas de este grupo que **se queda con su fecha
vieja**, porque el expediente no consulta BaFin. Lo consulté yo: solo sale
«Midas Fondsmaeglerselskab A/S · Grenzüberschreitender Dienstleister (WpI) gem.
§ 74 WpIG», como el 10/11. Arreglo: que el expediente o `decisiones.json` lleve
esta consulta de hoy (BaFin, 20:17:55 UTC, SHA-256 a8a0daad…) para que pase al
21/11; o cambiar la fuente al KID en español, leído hoy: «Midas Software GmbH no
está autorizada ni supervisada de otro modo por la BaFin ni por ninguna otra
autoridad de supervisión financiera».

**Recomendado.**
- Métrica «Comisiones (KID)»: el KID también cobra «Costes de operación 0,05 %
  del valor de su inversión al año». Texto: «Gestión 0 % · éxito 5 % del
  rendimiento positivo · operación 0,05 %/año · reembolso inmediato 0,07 %».
- La casilla «documento oficial» cita la página de documentación de Midas, que
  hoy da 403; el motor la pondrá «consultada el 21/11» aunque lo leído fueron
  los PDF. Mejor citar las Condiciones Finales en el CDN (200, b1e58001…).
- Con `fuentes_en_conflicto`, la ficha dice «✗ No · Se contrata hoy desde España ·
  No consta en la fuente que se contrate desde España», y las Condiciones Finales
  sí incluyen España. Es la web, no el dato: mejor un texto como «Las fuentes no
  coinciden: no lo damos por confirmado».
- Al retirar las referencias viejas, quedan sin citar en «Fuentes» midas.app,
  midas.app/products, midas.app/llms.txt, docs.midas.app/tokens/mtbill y
  docs.midas.app/legal/eligibility-and-compliance (todas tras el 403): quitarlas.

## Cuántos datos

171 datos visibles abiertos hoy en su fuente: Robinhood 42, Kraken 48,
Prosegur 51 y mTBILL 30 (en mTBILL no cuento las 6 referencias de midas.app que
no se pueden abrir).

## Sin poder comprobar

- midas.app/mtbill (el botón de la tarjeta), la página de documentación de Midas y
  `llms-full.txt`: 403 a las 20:15:50 UTC; no se insistió. Las demás direcciones
  de midas.app y docs.midas.app no se pidieron.
- Si un cliente de Kraken UE puede comprar las xStocks de Reino Unido y la UE: no
  hay fuente primaria de la entidad europea (la web de Kraken UE solo habla de
  EE. UU.).
- De las 58 condiciones finales del emisor de xStocks leí 4 (ANTx, LITEx, Zalando
  y Xetra-Gold); las otras 54 las leyó el investigador.
- Informes de auditoría y póliza de seguro del oro de Prosegur: no se publican.
- assets.backed.fi y la API del registro de la FMA: no se abrieron.
