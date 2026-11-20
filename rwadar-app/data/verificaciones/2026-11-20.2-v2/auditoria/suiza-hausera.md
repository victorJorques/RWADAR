# Auditoría independiente · ámbito «suiza-hausera» · 20/11/2026

Auditor independiente: no investigué ni monté estas fichas. Abrí yo mismo las
fuentes entre las **17:15:56 y las 17:25:51 UTC** del 20/11/2026, con
peticiones normales (curl con su agente por defecto, TLS, nodo público de
Ethereum en solo lectura). Copias de trabajo fuera del repositorio, en
`/tmp/auditoria-2026-11-20/suiza-hausera/`.

Fichas: **aktionariat** (principales), **boss-info** y **switzerlend**
(reventa) y **hausera-proximas-ofertas** (en camino). Base: lo publicado el
13/11 más los cambios de `DECISIONES-COORDINADOR.md` §2 y §4 con los textos de
`expedientes/<slug>.json` (`propuestaTarjeta`).

## Resultado en llano

- Las cifras, fechas y enlaces que se van a publicar **coinciden hoy con la
  fuente**: precios del emisor, recompra apagada, ventas más baratas entre
  accionistas, comisión del 1,9 %, mínimos, acceso Suiza + EEE, registro de
  FINMA, PolyReg, estado de Alicante 3 (preventa abierta, oferta pública el
  25/11), registro de la CNMV sin Alicante 3, y los ocho PDF con el mismo
  SHA-256. Los 29 enlaces citados responden (200).
- **Falta un aviso de riesgo importante en las tres fichas suizas:** ninguna
  dice que se puede perder todo el dinero, y las tres fuentes del emisor lo
  dicen (obligatoria, 3 hallazgos).
- **Boss Info:** la referencia nueva «Última operación · 20/11/2026» del
  expediente cita como fuente una API que solo acepta POST; abierta como
  enlace da **405 «Method not allowed»** (obligatoria). Es la misma corrección
  que ya se hizo el 13/11.
- Mejoras de claridad (recomendadas): Hausera dirá «la suscripción empieza el
  25/11/2026» hasta el 27/11; la clase C1 de Switzerlend no es la primera en
  cobrar; el mínimo de Aktionariat omite el pago en cripto; dos alcances
  antiguos de Boss Info dicen que no hubo operaciones después del 28/09.

## Lo que comprobé, dato a dato

### Aktionariat (principales)

| Dato visible | Fuente abierta hoy | Hora UTC | Resultado |
|---|---|---|---|
| Resumen: venta directa a precio fijo, recompra cerrada | `shares.aktionariat.com/` y `/trade` («DIRECT FROM ISSUER Buy DAKS at 7.25 CHF»); `brokerbotsettings?ticker=DAKS` (`onlyBuySide: true`, «the sell-side of the Brokerbot will remain disabled for the foreseeable future») | 17:15:56 / 17:17:03 | Coincide |
| Precio del emisor · 20/11/2026: 7,25 CHF (fijo) | En cadena, bloque 26457738: `getPrice() = 7,25`, `settings() = 1` (bit de recompra apagado) | 17:16:11 | Coincide |
| Mínimo 500 CHF por transferencia | `bankTransferLimit {enabled: true, min: 500}`; SHA-256 `e0fccbb9…`, igual que el vigía | 17:15:56 | Coincide (ver recomendación 3) |
| Acceso: Suiza o EEE, tope 100.000 € | `www.aktionariat.com/disclaimer`: «exclusively addressed to persons domiciled or resident in Switzerland or the EEA … limited to a total of €100,000»; mismo texto en Investor Page Terms §9.1 («Version 1.0 • October 30, 2026», SHA-256 `c77ab1ca…`) | 17:17:03 | Coincide |
| Supervisor: no figura en FINMA (20/11/2026) | API de búsqueda de FINMA, «Aktionariat»: `Count 0`; control «Sygnum»: 1 banco | 17:16:41 | Coincide |
| Venta: solo a otros accionistas | Igual que el resumen | 17:15:56 | Coincide |
| Moneda CHF / ZCHF | `baseCurrency CHF`, `baseCryptoCurrency ZCHF` | 17:15:56 | Coincide |
| Aviso: sin folleto ni KID, umbrales | Pie del portal: «Once certain thresholds are reached, it is the responsibility of the issuer to publish a prospectus»; «not subject to prudential supervision» | 17:17:03 | Coincide |
| Aviso: muy poca demanda | Libro: compras 6,10 × 10 … 1,00 × 20 (155 acciones, unos 680 ZCHF) | 17:15:56 | Coincide |
| Aviso: secundario en ZCHF con monedero propio | Portada: «instantly settled using Frankencoin (ZCHF)» | 17:17:03 | Coincide |
| Aviso: comisión 1,9 % al vender | `secondarymarketsettings`: `buyerFeeRate 0`, `sellerFeeRate 0.0190`; condiciones §4.1 «Applicable fees are borne by the seller» | 17:15:56 | Coincide |
| Aviso: 6,20 ZCHF frente a 7,25 CHF el 20/11/2026 | Libro: venta más barata 6,20 × 356 (luego 6,25 × 1.135) | 17:15:56 | Coincide |
| Aviso: no se publica cuánto queda del tope | Disclaimer y condiciones, sin cifra | 17:17:03 | Coincide |
| Última compra al emisor 31/10/2026 (ficha) | `getTrades` (1.231 operaciones, SHA-256 `6f9b3656…`, igual que el expediente) | 17:15:56 | Coincide |
| PDF Registration Agreement | SHA-256 `9b4ebb70…` (igual) | 17:16:57 | Coincide |
| PDF Token Holder Agreement (arrastre 75 %) | SHA-256 `650eec36…` (igual); «Acquisition Quorum 75%» | 17:16:57 | Coincide |
| Advertencias CNMV | «No hay datos disponibles» | 17:20:27 | Coincide |
| Riesgo de pérdida total | Disclaimer: «a loss of up to the entire capital invested may occur» | 17:25:44 | **Falta en la ficha (hallazgo 1)** |

### Boss Info (reventa)

| Dato visible | Fuente abierta hoy | Hora UTC | Resultado |
|---|---|---|---|
| Resumen: emisor a 8,50 CHF, nadie le compra desde el 29/06/2026; última operación 1 acción a 8,40 ZCHF el 05/11/2026 | `getTrades` (319 operaciones, SHA-256 `f02ec19d…`): última PRIMARY 29/06/2026 10:53:35Z (183); última SECONDARY 05/11/2026 13:35:35Z (1 a 8,40); `/trade` «Buy BOSS at 8.502 CHF»; en cadena `getPrice() = 8,50197` | 17:15:56 / 17:16:11 | Coincide |
| Mínimo 100 CHF por transferencia; en cripto desde 2 acciones (unos 17 ZCHF el 20/11) | `bankTransferLimit min 100`, `cryptoPaymentsLimit min 9` (SHA-256 `9a97fd74…`, igual que el vigía); 2 × 8,50197 = 17,00 | 17:15:56 | Coincide |
| Acceso: Suiza y EEE, tope 100.000 € | `shares.bossinfo.com/investor-page-terms` §9.1 (mismo archivo `c77ab1ca…`); FAQ del emisor: la lista de excluidos no incluye España | 17:17:03 | Coincide |
| Salida: el emisor no recompra; vendes en ZCHF si hay comprador | `settings() = 1`; `disabledSellText` «Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert»; el contrato tiene 2.491,46 ZCHF pero no los paga | 17:16:11 | Coincide |
| Supervisor: no figura en FINMA | «Boss Info»: `Count 0` | 17:16:41 | Coincide |
| Aviso §9.1 versión del 30/10/2026 | «Version 1.0 • October 30, 2026» | 17:17:03 | Coincide |
| Aviso comisión 1,9 % | `sellerFeeRate 0.0190` | 17:15:56 | Coincide |
| Aviso precio del emisor por encima de la venta más barata (8,40 el 20/11/2026) | Libro: 8,40 × 103; compra 7,30 × 1.000 | 17:15:56 | Coincide |
| Aviso XCHF frente a ZCHF | FAQ «Informationen zum xCHF»; ajustes `baseCryptoCurrency ZCHF` | 17:17:03 | Coincide |
| Referencia «Última operación · 20/11/2026» | Portada: «Current Price CHF 8.4 Last trade • 5 Nov 2026, 13:35» | 17:25:48 | Valor bien; **fuente del expediente rota (hallazgo 4)** |
| PDF Registration Regulations | SHA-256 `61327722…` (igual); «Transfer restrictions None» | 17:16:57 | Coincide |
| Advertencias CNMV | «No hay datos disponibles» | 17:20:27 | Coincide |
| Riesgo de pérdida total | Web del emisor: «Ein Wertverlust bis 100% des eingesetzten Kapitals ist möglich» | 17:25:45 | **Falta en la ficha (hallazgo 2)** |

### Switzerlend (reventa)

| Dato visible | Fuente abierta hoy | Hora UTC | Resultado |
|---|---|---|---|
| Resumen: C1 de Switzerlend AG, precio del emisor, sin recompra | `/trade` «Buy LENDS at 68.0105 CHF»; `getPrice() = 68,0105`; `settings() = 5` (sin el bit 0x2) | 17:17:03 / 17:16:11 | Coincide |
| Mínimo: 1 acción (68,01 CHF el 20/11) | `bankTransferLimit min 0`, `cryptoPaymentsLimit min 0` (SHA-256 `d55580ec…`, igual); token sin decimales | 17:15:56 | Coincide |
| Acceso: Suiza y EEE, tope 100.000 € | `shares.lend.ch/investor-page-terms` §9.1 (mismo archivo) | 17:17:03 | Coincide |
| Salida: no recompra hoy; su web dice lo contrario | Web de LEND: «You can sell back to the brokerbot when it holds sufficient liquidity»; acuerdo: «The Issuer is under no obligation to offer or repurchase the Share Tokens»; saldo ZCHF del contrato 0,0318 | 17:17:03 / 17:16:57 / 17:16:11 | Coincide |
| Clase: Preferente C1 (preferencia en liquidación) | Acuerdo LENDS: «All Share Tokens are issued as preferred C1 shares» y, en el reparto, primero «any preferred shares with senior ranking liquidation preferences»; registro mercantil: hay preferentes A1, A2, B, C1 y C2 | 17:16:57 / 17:22:53 | Cierto, pero incompleto (recomendación 2) |
| Supervisor: FINMA no; PolyReg solo blanqueo | FINMA `Count 0`; PolyReg `{"result": "true", "name": "Switzerlend AG"}` | 17:16:41 | Coincide |
| Aviso: capital, no préstamos | Acuerdo: acciones preferentes C1 | 17:16:57 | Coincide |
| Aviso: muy poca demanda | Libro: compra 59,00 × 4 | 17:15:56 | Coincide |
| Aviso: venta más barata 67,00 ZCHF el 20/11/2026 | Libro: 67,00 × 15 | 17:15:56 | Coincide |
| Aviso comisión 1,9 % | `sellerFeeRate 0.0190` | 17:15:56 | Coincide |
| PDF Token Shareholder Agreement y Registration Agreement | SHA-256 `89647998…` y `6d0ffcee…` (iguales) | 17:16:57 | Coincide |
| Advertencias CNMV | «No hay datos disponibles» | 17:20:27 | Coincide |
| Riesgo de pérdida total | Web de LEND: «Equity can lose value, including entirely» | 17:25:46 | **Falta en la ficha (hallazgo 3)** |

### Hausera · próximas ofertas (en camino)

| Dato visible | Fuente abierta hoy | Hora UTC | Resultado |
|---|---|---|---|
| Resumen: Alicante 2 financiada; Alicante 3 (14 viviendas, Orihuela Costa) con preventa abierta desde el 18/11 y suscripción el 25/11/2026 | Ficha de Alicante 3: «PREVENTA ABIERTA … Inicio de preventa: 18/11/2026 Inicio de oferta pública: 25/11/2026»; datos públicos `status PRESALE`, `presaleDate 18/11/2026` (SHA-256 `f95e3a75…`, igual que el expediente); Alicante 2 «FINANCIADA» (`FUNDED`) | 17:19:31 | Coincide (ver recomendación 1) |
| Próxima operación: suscripción del 25/11/2026 al 30/06/2027 | Documento de emisión: «se iniciará el 25/11/2026 y se extenderá hasta el 30/6/2027» | 17:20:07 | Coincide |
| Emisor SPV 11 | Documento, pág. 1: «HAUSERA PROPERTY MANAGER SPV 11, S.A» | 17:20:07 | Coincide |
| Supervisor: pendiente de inscribir por Ursus-3 (n.º 251) | Documento: «Ursus-3 Capital AV, S.A (nº Registro 251)»; CNMV, emisiones de Ursus-3, págs. 1 a 3: la última de Hausera es del 23/10/2026 (SPV 7 y SPV 8); ni SPV 9, 10 ni 11 | 17:20:27 | Coincide |
| Comisiones: ninguna para el suscriptor | Escritura: «libre de comisiones y gastos para el suscriptor»; documento: «el resto de la plusvalía … pago de los honorarios» | 17:20:07 | Coincide |
| Mínimo: desde 100 € | Documento: «Ticket mínimo: 100,00 euros»; FAQ: «El importe mínimo son 100€» | 17:20:07 / 17:19:31 | Coincide |
| Acceso: particulares tras test de idoneidad; Hausera no registrada | Documento 5.7: «considerarlo idóneo»; lista de PSFP de la CNMV sin Hausera ni Holdtx; advertencias CNMV sin datos | 17:20:07 / 17:21:37 | Coincide |
| Salida: al vender (20 meses, sin fecha cierta); sin secundario | Documento 2.3.5 y 2.3.7: «únicamente una vez se haya producido la venta efectiva del inmueble»; «pueden no tener un mercado secundario» | 17:20:07 | Coincide |
| Aviso: Holdtx no es ESI | Términos: «no actúa como empresa de servicios de inversión» | 17:19:31 | Coincide |
| Aviso: no es folleto, CNMV no lo revisó; sin inscribir el 20/11 | Documento pág. 1: «no es considerado un folleto informativo ni ha sido revisado»; registro de la CNMV (arriba) | 17:20:07 / 17:20:27 | Coincide |
| Aviso: reserva antes de inscribir; devolución sin intereses | Acuerdo de reserva, cl. 3: «podrán ser gestionados por el Emisor … sin devengo de intereses» (SHA-256 `69cbadaf…`, igual) | 17:20:07 | Coincide |
| Aviso: operaciones cubiertas en preventa (Alicante 2) | Alicante 2: «Inicio de preventa: 04/11/2026 Inicio de oferta pública: 11/11/2026», «FINANCIADA» | 17:19:31 | Coincide (el 10/11 es una observación anterior, fechada) |
| Avisos: previsiones del promotor; pérdida posible | Ficha: «Rentabilidad sobre inversión: 22,00%» (no está en la tarjeta); documento: «no garantiza la devolución del capital» | 17:19:31 / 17:20:07 | Coincide |
| Documentos de Drive | Documento de emisión `9170562a…`, acuerdo `69cbadaf…`, dossier `72a312e2…`: iguales | 17:20:07 | Coincide |

Normas de las tarjetas: los doce textos de `resumenTarjeta` miden 120
caracteres o menos, están en castellano, no dicen «por participación» ni
prometen nada; en reventa y en camino no hay rentabilidad ni precio
principal.

## Hallazgos

### 1 a 3 · Obligatoria · Falta el aviso de pérdida total (aktionariat, boss-info, switzerlend)

Son acciones de empresas no cotizadas y sin supervisión prudencial. Las tres
fichas tienen 6 o 7 avisos, pero ninguno dice que se puede perder el dinero.
Las demás fichas del catálogo con riesgo parecido sí lo llevan (Brickwise:
«posible pérdida total»; Hausera: «Puedes perder todo o parte del dinero»).
La propia fuente del emisor lo dice:

- Aktionariat, `https://www.aktionariat.com/disclaimer` (17:25:44 UTC): «An
  investment in shares is associated with various risks and a loss of up to
  the entire capital invested may occur.»
- Boss Info,
  `https://www.bossinfo.com/unternehmen/investor-relations/investor-tokens/`
  (17:25:45 UTC): «Ein Wertverlust bis 100% des eingesetzten Kapitals ist
  möglich.»
- Switzerlend, `https://lend.ch/en/investor-relations` (17:25:46 UTC):
  «Equity can lose value, including entirely.»

Corrección: añadir a cada una el aviso
«Son acciones de una empresa que no cotiza en bolsa: puedes perder todo el
dinero invertido.»

### 4 · Obligatoria · Boss Info: la fuente de «Última operación · 20/11/2026» es una API que da 405

El expediente (`propuestaTarjeta.referenciasFicha`) pone como fuente
`https://shares.bossinfo.com/api/secondarymarkets/getTrades`. Abierta como
enlace (GET) a las 17:22:11 UTC responde `405 {"status":405,"message":"Method
not allowed"}`. Además, esa URL no está en `documentacion.fuentes`; el
validador de la web (`rwadar-20260820.js`) descarta toda la documentación de
la ficha si una referencia cita una fuente que no está en la lista. Es la
misma corrección que hizo el revisor el 13/11 (`NO_APLICADO` de
`2026-11-13-v2/preparar-entrega.mjs`).

Corrección: mantener `https://shares.bossinfo.com/` como fuente. La portada
dice a las 17:25:48 UTC «Current Price CHF 8.4 Last trade • 5 Nov 2026,
13:35».

### Recomendaciones (claridad)

1. **Hausera, resumen.** La ficha vale hasta el 27/11 y la suscripción empieza
   el 25/11. Del 25 al 27 el texto «la suscripción empieza el 25/11/2026» queda
   viejo, y con el soft cap del 02/12/2026 cerca. Texto propuesto:
   «Seguimiento de las operaciones inmobiliarias de Hausera. Alicante 2 ya está
   financiada; la siguiente, Alicante 3 (14 viviendas en Orihuela Costa), tiene
   la preventa abierta desde el 18/11 y la suscripción anunciada del 25/11/2026
   al 30/06/2027.» Y volver a mirarla el 25/11.
2. **Switzerlend, métrica «Clase».** El acuerdo LENDS paga primero a «any
   preferred shares with senior ranking liquidation preferences» y la empresa
   tiene también preferentes A1, A2, B y C2 (registro mercantil, 17:22:53
   UTC). Texto propuesto: «Preferente C1: en una venta o liquidación cobra
   después de las preferentes de mayor rango que fijen los estatutos».
3. **Aktionariat, mínimo.** En cripto no hay mínimo (`cryptoPaymentsLimit
   min 0`, 17:15:56 UTC): se compra desde 1 acción. Boss Info sí lo explica.
   Texto propuesto: «500 CHF por transferencia; en cripto, desde 1 acción
   (7,25 ZCHF el 20/11)».
4. **Boss Info, dos referencias antiguas de la ficha** («Precio · consulta
   01/11/2026» y «Estado de la oferta · consulta 01/11/2026»). Su alcance dice
   «No hay operaciones posteriores al 28/09/2026» y «la última del
   28/09/2026». Hoy `getTrades` y la portada enseñan la del 05/11/2026 (1
   acción a 8,40 ZCHF). Propuesta: «En esa consulta no había operaciones
   posteriores al 28/09/2026; el 05/11/2026 hubo otra (1 acción a 8,40
   ZCHF).»

## Lo que no pude comprobar

- La ficha de Ursus-3 como agencia de valores n.º 251 en la CNMV: la ruta que
  probé (`/portal/consultas/esi/esi?nif=A86796182`) dio 403 (CVFE) y no
  insistí. El número sale del propio documento de emisión y la CNMV la
  muestra como ERIR.
- El mínimo en cripto de Boss Info, renderizado en el portal: necesita
  monedero o sesión. Lo deduzco de la API y del precio en cadena, como el
  expediente.
- Cuánto se ha reservado en la preventa de Alicante 3 y cuánto queda del tope
  de 100.000 € del EEE en los portales suizos: no se publica.
- No pulsé «Reservar tickets», no me registré y no conecté ningún monedero.
