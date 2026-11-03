# Revisión independiente · grupo Aktionariat · 02/11/2026

Revisor independiente (Claude), sin participación en la investigación. Alcance:
las 5 fichas publicadas (`aktionariat`, `boss-info`, `switzerlend`, `wemakeit`,
`servicehunter-quitt`). Solo páginas, APIs y contratos públicos (lecturas
`eth_call` de solo lectura en `ethereum-rpc.publicnode.com`); sin login, KYC,
formularios ni wallets. Las copias de lo leído quedan en el scratchpad de la
sesión, no en el repositorio (el encargo de revisión solo permite escribir este
archivo). No he editado expedientes ni `PARA-CODEX.md`.

Revisión: 2026-11-02, de 16:28Z a 16:35Z.

## Veredicto en una línea

| slug | propuesta del investigador | veredicto del revisor |
|---|---|---|
| aktionariat | actualizar | **aprobada_con_cambios** |
| boss-info | actualizar | **aprobada_con_cambios** (bajar a `secundario`) |
| switzerlend | actualizar | **aprobada_con_cambios** (bajar a `secundario`) |
| wemakeit | retirar_propuesta | **retirada_justificada** (corregir un dato del motivo) |
| servicehunter-quitt | retirar_propuesta | **retirada_justificada** |

## Qué he comprobado yo (fuentes y hora UTC real)

Lecturas propias, todas del 02/11/2026:

| hora UTC | fuente | qué da |
|---|---|---|
| 16:28:46–16:28:53 | `https://shares.{aktionariat.com,bossinfo.com,wemakeit.com,quitt.ch,lend.ch}/api/brokerbotsettings?ticker=…` (HTTP 200) | mínimos, textos de compra/venta desactivada, dirección del contrato de venta |
| 16:28:53 | `https://www.aktionariat.com/disclaimer` (HTTP 200, 41.909 B, sha256 `0336e84b…`) | quién puede comprar |
| 16:29:43–16:29:46 | `POST https://shares.…/api/secondarymarkets/getTrades` con `{"company":77 / 1664 / 860 / 10 / 40880}` (HTTP 200; la API devuelve las 20 más recientes) | últimas operaciones |
| 16:30:06–16:30:08 | `eth_call` `settings()` `0xe06174e4`, `getPrice()` `0x98d5fdca`, `increment()` `0xd09de08a` (selectores calculados con keccak-256) sobre los 5 contratos de venta | estado y precio on-chain |
| 16:30:41–16:31:54 | `/invest` y `/trade` renderizados con Playwright (Chromium), texto y captura | precio mostrado, libro de órdenes, tabla de operaciones |
| 16:32:35–16:32:59 | portadas `https://shares.…/` (HTML con los datos embebidos) | `valuationPolicy`, `issuerDefinedTokenPrice`, `lastPriceCheckpoint`, `lastSecondaryMarketTrade` |
| 16:32:37 | `https://www.zefix.ch/ZefixREST/api/v1/firm/989312.json` (HTTP 200) | publicaciones SHAB de ServiceHunter AG |

Lectura del campo `settings()`: bit 0x1 = el contrato vende al público
(compra al emisor); bit 0x2 = el contrato compra al público (recompra). El
investigador comprobó el bit 0x1 en el código; el significado del bit 0x2 lo
tomo del `Brokerbot.sol` de Aktionariat que conozco, sin releerlo hoy. Lo
corrobora el portal: en las cinco fichas solo aparece «Buy directly», nunca una
venta al emisor.

Contratos de venta leídos:

| slug | contrato | `settings()` | compra al emisor | recompra | `getPrice()` | `increment()` |
|---|---|---|---|---|---|---|
| aktionariat | `0x2f2c…350b` | 0x1 | sí | no | 7,25 | 0 |
| boss-info | `0x3e73…4e69` | 0x1 | sí | no | 8,50197 | 0,000005 |
| wemakeit | `0x01f1…687d` | 0x0 | no | no | 8,37826 | 0,00002 |
| servicehunter-quitt | `0x0273…b234` | 0x4 | no | no | 7,11154 | 0,00003 |
| switzerlend | `0x8d90…9b65` | 0x5 | sí | no | 68,0105 | 0,0005 |

---

## 1. aktionariat · aprobada_con_cambios

**Hechos que confirmo**

- **Venta del emisor abierta a 7,25 por acción, sin incremento.** On-chain
  `settings()`=0x1, `getPrice()`=7,25, `increment()`=0 (16:30:06Z). `/invest`
  muestra «Price per DAKS 7.25 CHF» y `/trade` «Buy DAKS at 7.25 CHF · bank
  transfer or crypto» (16:30:41Z y 16:30:50Z).
- **Última compra al emisor: 31/10/2026 11:56:35Z, 1 DAKS a 7,25 ZCHF.** Antes:
  27/10 (100), 14/10 (100), 08/10 (69 y 1). Fuente: `getTrades` (16:29:43Z) y
  la tabla de `/trade`.
- **El aviso legal admite Suiza y EEE con tope EEE de 100.000 €.** Literal:
  «The public offer to purchase the shares is exclusively addressed to persons
  domiciled or resident in Switzerland or the EEA… The offer for persons from
  the EEA is limited to a total of €100,000.» (`aktionariat.com/disclaimer`,
  16:28:53Z).
- **Mínimo 500 CHF por transferencia; sin mínimo en cripto.**
  `bankTransferLimit.min`=500 y `cryptoPaymentsLimit.min`=0 (16:28:46Z).
- **Recompra cerrada.** `onlyBuySide: true`, bit 0x2 apagado y el texto
  «…the sell-side of the Brokerbot will remain disabled for the foreseeable
  future…» (16:28:46Z).
- **Mejor oferta de compra: 6,00 ZCHF por 5 acciones.** Por debajo hay 5,00
  (100), 4,50 (9), 4,00 (1) y 3,33 (3). Comisión del secundario: 0 %
  (`/trade`, 16:30:50Z).

**Discrepancias y omisiones**

1. **Lo que no recoge la tarjeta: en el secundario hay vendedores más baratos
   que el emisor.** El libro de `/trade` (16:30:50Z) tiene ofertas de venta a
   6,20 ZCHF (356 acciones), 6,25 (1.389), 6,80 (40), 6,90 (10) y 7,20 (1.000),
   todas por debajo de los 7,25 del emisor. La última operación entre
   accionistas fue el 30/09/2026 a 6,25 ZCHF. En septiembre hubo cruces entre
   4,50 y 6,25. Quien compra al emisor paga alrededor de un 17 % más que la
   mejor oferta de venta visible. La tarjeta de boss-info sí avisa de lo mismo;
   aquí falta.
2. **«Supervisor: Ninguno (sin licencia FINMA)» no está comprobado en el
   registro.** El investigador dice que no buscó a ninguna empresa en el
   registro de entidades autorizadas de FINMA; solo miró la lista de
   advertencias. El portal dice que el **secundario** es una «non-commercial
   trading facility… not subject to prudential supervision». Eso no demuestra
   que el emisor no tenga ninguna autorización. Según el encargo, la ausencia de
   licencia también hay que verla en el registro.
3. **El acceso desde España se apoya en documentos, con dos límites.** (a) El
   aviso está en `www.aktionariat.com/disclaimer`; `/invest` no lo repite ni
   nombra países. Que se aplique a la oferta DAKS es una inferencia razonable
   (mismo emisor), pero no lo dice literalmente. (b) El tope de 100.000 € es
   para todo el EEE y no se publica cuánto queda. Puede estar agotado. Con
   eso, `disponibleEs: confirmado` es aceptable solo como «admitido según el
   aviso legal», no como acceso probado.
4. **Divisa.** `/invest` muestra el precio en CHF, pero `getTrades`, el libro y
   la tabla lo dan en ZCHF. «7,25 CHF» es correcto para la compra por
   transferencia; el secundario va en ZCHF.

**Cambios obligatorios en la tarjeta**

- Añadir un aviso: «En el mercado entre accionistas hay ofertas de venta por
  debajo del precio del emisor (6,20 ZCHF el 02/11/2026). La última operación
  entre accionistas fue a 6,25 ZCHF el 30/09/2026.»
- Cambiar la métrica «Supervisor» por «Sin supervisión prudencial declarada
  (registro FINMA no consultado)». Otra opción: quitarla hasta que se consulte
  el registro de autorizados de FINMA. Hay que quitar «sin licencia FINMA».
- En la métrica «Acceso», o en un aviso: «Según el aviso legal de Aktionariat.
  Tope conjunto EEE de 100.000 €; no se publica cuánto queda.»
- Cambiar «(fijo)» por «fijado por el emisor, sin incremento por volumen», para
  que no se lea como precio garantizado. La fecha de la métrica tiene que ser la
  de la última comprobación.
- El resto se mantiene: mínimo 500 CHF, recompra cerrada, mejor compra 6,00 ×
  5, `rentabilidad: null` y `coleccion: principales`. Es la única de las cinco
  con acceso EEE documentado.

---

## 2. boss-info · aprobada_con_cambios

**Hechos que confirmo**

- **Precio del emisor: 8,50197**, con incremento de 0,000005 por acción;
  `settings()`=0x1, así que la compra al emisor está técnicamente activa
  (16:30:07Z). `/invest` muestra «8.5 CHF» y `/trade` «Buy BOSS at 8.502 CHF»
  (16:31:02Z y 16:31:46Z).
- **Última operación: 28/09/2026 11:32:59Z, 474 BOSS a 6,70 ZCHF, entre
  accionistas** (`getTrades` 16:29:43Z; portada `lastSecondaryMarketTrade`).
  La cabecera de `/trade` muestra «CHF 6.7».
- **Recompra cerrada.** Bit 0x2 apagado. Texto configurado: «Aktuell ist der
  Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert» (16:28:48Z).
- **Libro de órdenes.** Compras a 7,30 (1.000) y 6,51 (1.500); venta a 8,40
  (104); diferencial del 13,10 % (16:31:02Z).
- **Mínimo: 100 CHF por transferencia; 9 en cripto** (16:28:48Z).
- **Acceso desde España: no consta.** Ni la portada, ni `/invest`, ni `/trade`
  mencionan países, EEE, residencia ni ningún aviso legal parecido al de
  Aktionariat (búsqueda en el HTML y en el texto renderizado, 16:32:58Z).
  `investmentTerms` está vacío.

**Discrepancias y omisiones**

1. **Nadie compra al emisor desde hace tiempo.** Las 20 operaciones más
   recientes de `getTrades` (del 13/07/2026 al 28/09/2026) son todas entre
   accionistas; ninguna es compra al emisor. «Abierta» es técnicamente cierto,
   pero el emisor vende un 27 % por encima de la última operación (8,50 frente
   a 6,70) y por encima de la mejor venta del secundario (8,40). La tarjeta ya
   dice esto último; el dato del 27 % y la falta de compras al emisor ayudan a
   entenderlo.
2. **«Supervisor: Ninguno».** Mismo problema que en aktionariat: no se ha
   consultado el registro de FINMA.
3. **Hay un texto de «compra desactivada por mantenimiento» configurado**
   («Aktuell ist der Verkauf … aufgrund eines Wartungsfensters deaktiviert»).
   Hoy no se muestra, porque la compra está activa on-chain. Indica que el
   emisor suspende la venta de vez en cuando. No es un error del investigador,
   pero conviene tenerlo en cuenta en la vigencia.

**Respuesta a la pregunta 2: ¿mantener en `principales` sin acceso desde
España?** **No.** El enfoque de Víctor (01/11) pone en primer lugar que «se
pueda comprar de verdad desde España, hoy, como particular». El encargo manda
priorizar lo accesible y dejar el resto «con menor prioridad». El aviso legal
EEE de Aktionariat AG cubre la oferta de Aktionariat AG, no la de otros
emisores que usan su tecnología. Extenderlo a Boss Info o a Switzerlend sería
deducir. Propongo **bajarlas a `secundario`** con el aviso de acceso no
confirmado, hasta que un documento del emisor diga quién puede comprar.

**Cambios obligatorios en la tarjeta**

- `coleccion`: `principales` → **`secundario`**.
- Cambiar la métrica «Supervisor» por la misma fórmula que en aktionariat.
- Añadir al resumen o a un aviso: «No hay compras al emisor entre las
  operaciones registradas desde julio de 2026; las últimas fueron entre
  accionistas a 6,70–6,91 ZCHF (28/09/2026).»
- Se mantienen: el aviso de acceso no confirmado, el de recompra cerrada, el de
  8,50 > 8,40, el mínimo de 100 CHF y `rentabilidad: null`.

---

## 3. switzerlend · aprobada_con_cambios

**Hechos que confirmo**

- **Venta del emisor abierta a 68,0105 por acción**, con incremento de 0,0005;
  `settings()`=0x5 (bit 0x1 encendido, 0x2 apagado) (16:30:08Z). `/invest`
  muestra «68.01 CHF» y la orden por defecto de 6 acciones suma 408,07 CHF
  (16:31:54Z).
- **Última compra al emisor: 07/10/2026 13:34:35Z** (10 + 1 LENDS a unos
  68,01). Antes, 25/09 (6) y 03/09 (3). La última operación entre accionistas
  fue el 25/08/2026: 1 LENDS a 67,00 ZCHF (`getTrades` 16:29:46Z).
- **Recompra cerrada** (bit 0x2 apagado). **Mejor compra en el secundario:
  59,00 ZCHF por 4 acciones.** Las ventas están a 67,50 (2), 67,90 (25) y 68,00
  (150); diferencial del 12,59 % (16:31:36Z).
- **Sin mínimo configurado.** `bankTransferLimit.min`=0 y
  `cryptoPaymentsLimit.min`=0 (16:28:52Z).
- **Acceso desde España: no consta** en la portada ni en `/invest` o `/trade`
  (16:32:59Z).

**Discrepancias**

1. **«Supervisor: No verificado».** Es más honesto que el «Ninguno» de las
   otras dos tarjetas, pero no coincide con ellas. Hay que usar la misma fórmula
   en las tres.
2. **Hay vendedores en el secundario algo por debajo del emisor** (67,50 frente
   a 68,01). La diferencia es pequeña (0,8 %) y no exige aviso.
3. No he comprobado yo la clase C1, la preferencia en liquidación ni la
   ausencia de restricción de transmisión (Zefix, LENDS Token Agreement). Lo
   dejo como lo dejó el investigador.

**Cambios obligatorios en la tarjeta**

- `coleccion`: `principales` → **`secundario`**, por el mismo motivo que
  boss-info.
- Usar en «Supervisor» la misma fórmula que en las demás.
- Se mantienen: el precio, la última compra (07/10/2026), la recompra cerrada,
  la mejor compra 59 × 4, el aviso de acceso no confirmado y el de «capital de
  la empresa, no préstamos de LEND».

---

## 4. wemakeit · retirada_justificada

**Hechos que confirmo**

- **Los 8,38 CHF no salen de ninguna operación.** La portada embebe
  `valuationPolicy:"ISSUER_DEFINED"` e `issuerDefinedTokenPrice` = 8,37826 y lo
  muestra como «8.38 · Issuer Defined» (16:32:35Z). El contrato de venta tiene
  `settings()`=0x0 (ni vende ni recompra) y `getPrice()`=8,37826 (16:30:07Z).
  Los textos configurados son «Aktuell stehen keine wemakeit-Aktien zum
  Verkauf» y «Aktuell können keine wemakeit-Aktien verkauft werden».
- **Última operación real: 20/10/2026, 0,80 ZCHF** (12:13:59Z, 74 acciones;
  12:14:23Z, 426 acciones). Fuente: `getTrades` (16:29:45Z) y
  `lastSecondaryMarketTrade` en la portada.
- **Libro de órdenes:** mejor compra 0,11 (6.000) y mejor venta 0,80 (584);
  diferencial del 86,25 % (16:31:13Z).

**Discrepancia (no cambia el veredicto)**

- El investigador escribe «cruces entre 0,10 y 1,00 desde julio» y, en el aviso
  propuesto, «las compraventas reales **de 2026** se han cruzado entre 0,10 y
  1,00 ZCHF». **No es exacto.** `getTrades` registra 1,90 ZCHF el 16/07/2026 y
  1,80 ZCHF el 21/07/2026. Lo correcto es: «entre 0,10 y 1,90 ZCHF desde
  mediados de julio de 2026; entre 0,10 y 1,00 desde el 21/07/2026». Si se
  publica cualquier texto con el rango, hay que corregirlo.

**Por qué la retirada está justificada:** no se puede comprar al emisor. La
única cifra visible en el portal (8,38) está 10 veces por encima de lo que se
paga de verdad. El secundario solo funciona en cripto y con un diferencial del
86 %. Para el inversor común en España esta ficha resta confianza.

**Si Víctor decide mantenerla**, cambios mínimos: pasarla a `secundario` (ya
propuesto), quitar la métrica «Valor fijado por el emisor 8,38 CHF», porque
aunque diga «no ejecutable» induce a error, y corregir el rango de precios.

---

## 5. servicehunter-quitt · retirada_justificada

**Hechos que confirmo**

- **El «Last trade • 2 Oct 2026, 00:00» de la portada no es una operación.** En
  el HTML, `lastPriceCheckpoint.whenCreated` es "2026-10-02T00:00:00Z" y
  `lastSecondaryMarketTrade.whenCreated` es "2026-07-23T15:19:11Z" a 8,00
  (16:32:36Z).
- **Última operación real: 23/07/2026 15:19:11Z, 10 DQTS a 8,00 ZCHF.** La
  última compra al emisor fue el 02/11/2025 (250 a 7,115275). Fuente:
  `getTrades` (16:29:45Z) y la tabla de `/trade`.
- **El emisor no vende ni recompra.** `settings()`=0x4, con los bits 0x1 y 0x2
  apagados (16:30:08Z). Los textos configurados remiten a «go to
  shares.quitt.ch to trade».
- **Libro de órdenes:** compras a 5,00 (10) y 3,00 (6), 16 acciones en total;
  venta a 8,00 (200); diferencial del 37,50 % (16:31:24Z).
- **Restricción estatutaria de transmisión.** En Zefix, la publicación SHAB del
  17/11/2023 (cambio de estatutos del 24/10/2023) dice: «Vinkulierung neu: Die
  Übertragbarkeit der Namenaktien ist nach Massgabe der Statuten beschränkt.»
  Las publicaciones posteriores (23/04/2024, 01/07/2025, 03/07/2026 y
  22/07/2026) no la levantan: no mencionan «Vinkulierung» (16:32:37Z). Antes,
  en 2021, se había suprimido una restricción anterior; la de 2023 la
  reintroduce.

**Discrepancias:** ninguna relevante. El investigador anota como `fechaDato`
el 24/10/2023, que es la fecha de los estatutos. Conviene citar también la del
SHAB (17/11/2023), como hace su resumen.

**Por qué la retirada está justificada:** no se puede comprar al emisor. No hay
operaciones desde hace más de tres meses y los compradores visibles suman 16
acciones. La fecha que muestra el portal confunde y la transmisión está
restringida por estatutos.

---

## Cambios comunes a las tres que siguen

- **Supervisor, con la misma fórmula en las tres:** «Sin supervisión prudencial
  declarada (registro FINMA no consultado)». Mejor todavía: consultar en el
  próximo ciclo el registro de autorizados de FINMA por el nombre exacto de cada
  emisor.
- **Divisa.** La compra al emisor se muestra en CHF y el secundario va en
  Frankencoin (ZCHF). Las métricas del secundario deben llevar «ZCHF», como ya
  hacen.
- **Vigencia.** Los precios del emisor pueden cambiar y la compra se puede
  desactivar en cualquier momento (boss-info tiene ya preparado un texto de
  «mantenimiento»). Hay que mantener `vigenciaDias` corto.

## Límites de esta revisión

- No he comprobado el registro ni el KYC de ningún portal, porque está
  prohibido. El acceso EEE de aktionariat sale solo del aviso legal.
- No he consultado el registro de autorizados de FINMA ni la lista de
  advertencias de la CNMV; me fío de la búsqueda del investigador para las
  advertencias.
- No he releído los Registration o Token Agreements (clase C1 de Switzerlend,
  drag-along de DAKS).
- `getTrades` devuelve solo las 20 operaciones más recientes. Mis rangos y
  fechas se limitan a esa página: desde el 07/07/2026 en aktionariat, el
  13/07/2026 en boss-info, el 14/07/2026 en wemakeit, el 02/05/2025 en quitt y
  el 04/11/2025 en switzerlend.
