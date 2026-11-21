# Revisión independiente · grupo suiza · 21/11/2026

Revisé las tres fichas del grupo (Aktionariat, Boss Info y Switzerlend) abriendo
yo mismo las fuentes entre las **18:00 y las 18:11 UTC** del 21/11/2026, unos
15–25 minutos después del investigador. No preparé estos expedientes. Copias y
huellas en `fuentes/suiza/` (`log.txt` lleva la URL, la hora y el SHA-256 de
cada lectura).

## Veredicto: aprobado con cambios

Las tres siguen abiertas hoy y lo que propone el investigador está bien
respaldado. Solo hay que corregir una cosa de fondo (la «Clase» de
Switzerlend), cambiar una palabra en el aviso nuevo de Aktionariat y dejar fuera
de Git la carpeta `crudo/` del grupo. No hay admisiones ni retiradas en este
grupo.

**La respuesta a lo que pregunta Víctor** («no sé si ya se puede seguir
invirtiendo»): sí, se puede en las tres. El emisor sigue vendiendo y un
particular residente en España entra en la oferta según las condiciones del
portal. El límite es el tope de 100.000 € para todo el EEE: nadie publica cuánto
queda. Ojo con dos fichas: **Boss Info y Switzerlend salen hoy en la web con
«Condiciones pendientes de nueva revisión»** (lectura pública
`lectura-publica/ofertas-v2.json`: `estado_revision: no_verificable`,
`disponible_es: null`). A quien las vea le parecerá que están caducadas, aunque
hoy están comprobadas. Eso lo arregla la entrega, no este grupo (ver «Para la
entrega»).

## Lo que comprobé, ficha a ficha

### Aktionariat (principales)

| Qué | Fuente y hora (UTC) | Lo que vi | ¿Coincide? |
|---|---|---|---|
| Sigue abierta | `https://shares.aktionariat.com/trade`, 18:04:18 | «DIRECT FROM ISSUER Buy DAKS at 7.25 CHF · bank transfer or crypto» | Sí |
| Precio del emisor y recompra | Ethereum, `getPrice()` y `settings()` del contrato 0x2f2c…350b, bloque 26465139, 18:02:03 | 7,25 · settings = 1 (vende; no recompra) · le quedan 16.737 DAKS | Sí (igual que el vigía) |
| Ventas de hoy entre accionistas | `POST /api/secondarymarkets/getTrades` (company 77), 18:00:22, SHA-256 `ebad27e1…`, el mismo archivo que leyó el investigador | 08:01:47 10 acciones a 6,10 · 08:02:11 5 a 6,00 · 08:02:23 62 a 5,00 ZCHF | Sí |
| Las mismas ventas en la cadena | recibos de las tres transacciones, 18:02:03 | estado 1 en los bloques 26462150, 26462152 y 26462153; se movieron 10, 5 y 62 DAKS por 61, 30 y 310 ZCHF; el vendedor pagó 1,159, 0,57 y 5,89 ZCHF de comisión (1,9 %) | Sí |
| Última compra al emisor | getTrades | 31/10/2026, 1 acción a 7,25 | Sí |
| Último cruce antes de hoy | getTrades | 30/09/2026, 1 acción a 6,25 (y 22/09, 1 a 6,25) | Sí: las referencias viejas sobran |
| 12 meses (21/11/2025–21/11/2026) | getTrades | 22 compras al emisor (5.783 acciones) y 55 entre accionistas (3.522) | Sí |
| Libro de órdenes | `POST /api/secondarymarkets/getOrderBook`, 18:00:22, y `/trade` renderizado | compras 5,01×5, 5,00×38, 4,50×10, 2,00×5, 1,00×20 (78 acciones); venta más barata 6,20×356; «Bid/Ask 5.01 / 6.20», «Spread 19.19%», «24h Vol CHF 401» | Sí |
| Mínimo | `/api/brokerbotsettings?ticker=DAKS`, 18:00:04, SHA-256 `0293edb7…` (el mismo del vigía) | `bankTransferLimit: {enabled: true, min: 500}`; sin campo `identityVerification` | Sí |
| Recompra (texto) | el mismo archivo | «the sell-side of the Brokerbot will remain disabled for the foreseeable future» | Sí |
| Comisión al vender | `/api/secondarymarketsettings?ticker=DAKS`, 18:00:05, y en cadena `tradingFeeBips()` = 190, `isOpen()` = 1 | `sellerFeeRate 0.019`, `buyerFeeRate 0` | Sí |
| Acceso desde España | `https://www.aktionariat.com/disclaimer`, 18:02:48 (mismo HTML que el investigador, `51971f13…`) | «exclusively addressed to persons domiciled or resident in Switzerland or the EEA … limited to a total of €100,000» | Sí |
| Condiciones del portal | `https://shares.aktionariat.com/investor-page-terms`, 18:02:48, `c77ab1ca…` | «Version 1.0 • October 30, 2026» · §9.1 igual · §3.1 «may refuse to accept any person as User» · §4.1 «Applicable fees are borne by the seller» | Sí |
| Portada | `https://shares.aktionariat.com/`, 18:04:03 | «Current Price CHF 5 · Last trade • 21 Nov 2026, 08:02 · Market Cap CHF 8'916'315 · Tokenized Shares 800'000 DAKS · Shareholders 368» | Sí |
| Riesgos | disclaimer | «a loss of up to the entire capital invested may occur» | Sí |

### Boss Info (reventa)

| Qué | Fuente y hora (UTC) | Lo que vi | ¿Coincide? |
|---|---|---|---|
| Sigue abierta | `https://shares.bossinfo.com/trade`, 18:04:32 | «Buy BOSS at 8.502 CHF · bank transfer or crypto» | Sí |
| Precio y recompra | Ethereum, contrato 0x3e73…4e69, 18:02:03 | `getPrice()` 8,50197 · settings = 1 · 11.171 BOSS y 2.491,46 ZCHF en el contrato | Sí (igual que el vigía) |
| Historial | `POST getTrades` (company 1664), 18:00:24, SHA-256 `f02ec19d…` (el mismo) | última operación 05/11/2026 13:35, 1 acción a 8,40; última compra al emisor 29/06/2026 (183 acciones); 12 meses: 10 compras al emisor (448) y 71 entre accionistas (52.146) | Sí |
| Libro | `POST getOrderBook`, 18:00:23, y `/trade` | compras 7,30×1.000, 5,00×5, 3,00×10; venta 8,40×103; «Bid/Ask 7.30 / 8.40 · Spread 13.10%» | Sí |
| Mínimo | `/api/brokerbotsettings?ticker=BOSS`, 18:00:06, SHA-256 `ec9ff651…` (el mismo del vigía) | `bankTransferLimit min 100`; `cryptoPaymentsLimit min 9` → 1 acción (8,50) no llega y 2 acciones son 17,00 | Sí |
| Recompra (texto) | el mismo archivo | «Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters deaktiviert» | Sí |
| Comisión | `/api/secondarymarketsettings?ticker=BOSS` y `tradingFeeBips()` = 190 | 1,9 % para quien vende | Sí |
| Acceso desde España | `https://shares.bossinfo.com/investor-page-terms`, 18:02:49 | mismo archivo `c77ab1ca…` que el de Aktionariat: §9.1 Suiza + EEE, tope 100.000 € | Sí |
| Países excluidos por el emisor | `https://www.bossinfo.com/unternehmen/investor-relations/investor-faq/`, 18:02:50 | «Wer kann keine Aktien kaufen? … United States of America, People’s Republic of China, Afghanistan…»; España no está | Sí |
| Portada | `https://shares.bossinfo.com/`, 18:04:25 | «Market Cap CHF 89'367'004 · Tokenized Shares 10'650'100 BOSS · Shareholders 155» | Sí |

### Switzerlend (reventa)

| Qué | Fuente y hora (UTC) | Lo que vi | ¿Coincide? |
|---|---|---|---|
| Sigue abierta | `https://shares.lend.ch/trade`, 18:04:51 | «Buy LENDS at 68.0105 CHF · bank transfer or crypto» | Sí |
| Precio, recompra y fondos | Ethereum, contrato 0x8d90…9b65, 18:02:03 | `getPrice()` 68,0105 · settings = 5 (vende; no recompra) · 0,0318 ZCHF · le quedan 57 LENDS | Sí (igual que el vigía) |
| Historial | `POST getTrades` (company 40880), 18:00:24, SHA-256 `97a527d4…` (el mismo) | última compra al emisor 07/10/2026 (10 a 68,005 y 1 a 68,01); la del 25/09 fue también una compra al emisor (6 acciones), no un cruce; último cruce entre accionistas 25/08/2026, 1 a 67,00 | Sí: el «cruce» del 25/09 estaba mal nombrado |
| Libro | `POST getOrderBook`, 18:00:24, y `/trade` | compra 59,00×4 (única); ventas 67,00×15, 67,50×10, 67,90×25, 68,00×150; «Bid/Ask 59.00 / 67.00 · Spread 11.94%» | Sí |
| Mínimo | `/api/brokerbotsettings?ticker=LENDS`, 18:00:07, `8852d0ad…` | `bankTransferLimit min 0`; `/invest` enseña la orden por defecto de 6 acciones «Total: 408.07 CHF» | Sí: el mínimo es 1 acción; «408,07» no lo es |
| Comisión | `/api/secondarymarketsettings?ticker=LENDS` y `tradingFeeBips()` = 190 | 1,9 % para quien vende | Sí |
| Acceso desde España | `https://shares.lend.ch/investor-page-terms`, 18:02:49 | mismo archivo `c77ab1ca…`: §9.1 Suiza + EEE, tope 100.000 € | Sí |
| Choque web/contrato | `https://lend.ch/en/investor-relations`, 18:02:53 | sigue: «You can sell back to the brokerbot when it holds sufficient liquidity» | Sí |
| Token SHA | PDF `LENDS_TOKEN_Agreement.pdf`, 18:02:54, SHA-256 `89647998…` (el mismo) | §1.4 «The Issuer is under no obligation to offer or repurchase the Share Tokens» · §2 b «an amount equal to CHF 53.72» | Sí, pero ver la corrección de «Clase» |
| Portada | `https://shares.lend.ch/`, 18:04:45 | «Total Shares 31'066 · Market Cap CHF 48'409'858 · Tokenized Shares 27'277 LENDS · Shareholders 286» | Sí |

### Registros y advertencias (las tres)

- **FINMA, registro de autorizados** (`POST https://www.finma.ch/en/api/search/getresult`,
  18:05:29–18:05:31): «Aktionariat», «Boss Info» y «Switzerlend» dan `Count 0`.
  Control: «Sygnum» da 1 («Sygnum Bank AG, Authorised as bank»). Las tres
  respuestas tienen el mismo SHA-256 que las del investigador.
- **FINMA, lista de advertencias** (18:05:39, SHA-256 `22c34dc5…`, el mismo):
  2.407 entradas; ninguna contiene «aktionariat», «boss info», «bossinfo»,
  «switzerlend» ni «lend.ch».
- **PolyReg** (18:05:31–18:05:32): Aktionariat AG `false`, Boss Info AG `false`,
  Switzerlend AG `true`. Es control de blanqueo, no supervisión.
- **Zefix** (18:06:55–18:06:57): las tres sociedades «EXISTIEREND», con el mismo
  SHA-256 que el investigador.
- **CNMV** (`https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`,
  18:06:08–18:06:15): «Aktionariat», «Aktionariat AG», «Boss Info», «Boss Info
  AG», «Switzerlend» y «Switzerlend AG» dicen «No hay datos disponibles».
  Control: «Trading» (18:06:17) trae 10 filas de advertencias, así que el
  buscador funciona.

## Lo re-fechado con el vigía (muestreo)

Comprobé con mi propia lectura **todas** las entradas `segunVigia` de las tres
fichas (28): todas están en `vigia.json` con «no cambia», con la misma hora y el
mismo SHA-256. Para este grupo el vigía no tiene ningún «cambia» ni ningún «no
se pudo leer». Lo que abrí hoy yo:

- **Mismo SHA-256 que el vigía:** brokerbotsettings de DAKS (`0293edb7…`) y de
  BOSS (`ec9ff651…`); los tres PDF (Registration Agreement de DAKS `9b4ebb70…`,
  Registration Regulations de BOSS `61327722…` y Token SHA de LENDS
  `89647998…`).
- **Mismas cifras que el vigía:** las nueve lecturas en cadena del paquete
  `68139cfb…` (precio, ajustes y ZCHF de los tres contratos) dan hoy los mismos
  valores. Los libros de DAKS y LENDS son idénticos a los del vigía salvo el
  campo `whenUpdated`. En el de BOSS, la venta más barata es la misma (8,40×103).
  Las dos compras pequeñas (5×5,00 y 10×3,00) aparecieron después de la lectura
  del vigía (17:36:56): eso no toca ninguna cifra publicada.
- **CNMV:** mi HTML tiene otro SHA-256 (la página lleva partes que cambian en
  cada visita), pero el texto extraído es idéntico al que guardó el vigía
  (`b8f2c193…`) y dice lo mismo: «No hay datos disponibles».
- Detalle menor: en `boss-info.json`, el claim «derecho» lleva
  `segunVigia: true` sin `sha256`. El documento está en el vigía (`61327722…`,
  17:36:55, «no cambia») y yo lo descargué con la misma huella. Conviene añadir
  el `sha256` al claim.

## Textos de la tarjeta (resumenTarjeta)

Todos tienen 120 caracteres o menos, con fuente y fecha, y ningún texto lleva
«oportunidad», «rentabilidad», «garantiz…» ni un %.

| Ficha | Campo | Texto | Caract. | Veredicto |
|---|---|---|---|---|
| Aktionariat | mínimo | 500 CHF por transferencia bancaria | 34 | Bien |
| Aktionariat | acceso | Disponible para residentes en Suiza y el Espacio Económico Europeo, con un tope total de 100.000 € para el EEE. | 111 | Bien (sugerencia abajo) |
| Aktionariat | salida | Venta solo a otros accionistas; el emisor no recompra | 53 | Bien |
| Boss Info | mínimo | 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF, precio a 21/11) | 95 | Bien (sugerencia abajo) |
| Boss Info | acceso | Sí para comprar al emisor, según las condiciones del portal: admite Suiza y EEE, con tope total de 100.000 € en el EEE | 118 | Bien |
| Boss Info | salida | El emisor no recompra ahora; vendes a otros accionistas en ZCHF si hay comprador | 80 | Bien |
| Switzerlend | mínimo | 1 acción (68,01 CHF el 21/11, precio del emisor) | 48 | Bien |
| Switzerlend | mínimo corto | 1 acción (68,01 CHF a 21/11) | 28 (≤ 40) | Bien |
| Switzerlend | acceso | igual que Boss Info | 118 | Bien |
| Switzerlend | salida | El emisor no recompra hoy (su web dice lo contrario); vendes a otros accionistas en ZCHF si hay comprador | 105 | Bien |

He comprobado en `vigia.mjs` que el vigía sigue pudiendo leer los textos
nuevos: «unos (\d+) ZCHF» en Boss Info, «\(([\d,]+) CHF el» en Switzerlend y el
primer «… ZCHF» del aviso de Aktionariat (6,20, porque 7,25 va en «CHF»).

## Correcciones obligatorias

1. **Switzerlend · «Clase» y `derechoAdquirido`.** «cobra hasta 53,72 CHF» se
   lee como un tope, y no lo es. El Token SHA §2 describe una «one-time
   non-participating liquidation preference»: primero cobran las preferentes de
   rango superior; después, cada acción C1 cobra 53,72 CHF (a prorrata si no
   alcanza). Y el párrafo final deja a las preferentes cobrar como acción
   ordinaria («as-converted») si así les toca más. Además, la preferencia se
   acaba si la empresa sale a bolsa («shall terminate … upon completion of a
   Listing»). Escrito así, un lector puede pensar que en una venta nunca
   recuperaría más de 53,72 CHF frente a los 68,01 que paga hoy.
   Texto propuesto para «Clase»: «Preferente C1: en una venta o liquidación
   cobra 53,72 CHF por acción antes que las ordinarias y detrás de las
   preferentes de rango superior (no es un tope)». Hay que cambiar lo mismo en `derechoAdquirido`, en
   el claim «derecho» y en el alcance de «Qué se adquiere».
2. **Aktionariat · aviso nuevo.** Cambiar «se cruzaron» por «se vendieron»
   («cruzar» es jerga de mercado): «Entre accionistas se vende por debajo del
   precio del emisor (7,25 CHF): el 21/11/2026 la venta más barata era de
   6,20 ZCHF y ese día se vendieron 62 acciones a 5,00 ZCHF.» Las cifras están
   bien y el vigía lo sigue leyendo igual.
3. **Grupo · `grupos/suiza/fuentes/crudo/` fuera de Git.** El `.gitignore` solo
   excluye `*/vigia-crudo/`, no `grupos/*/fuentes/crudo/`. Esa carpeta trae
   datos de personas físicas: las publicaciones del SHAB en `zefix-*.json`
   (nombres de consejeros), un correo personal en
   `boss-info-brokerbotsettings.json` y las direcciones de monedero de quienes
   compraron y vendieron hoy en `onchain-dakstrades-20261121.json`. Ningún ciclo
   anterior la subió. Que el coordinador no la añada al commit, o que la recorte
   antes. Lo demás está limpio: los expedientes, el resumen, el inventario y los
   `.txt` del grupo no llevan nombres de personas ni correos personales (el
   correo va como «[correo recortado]»; «Boss» solo sale como nombre de la
   empresa).

## Sugerencias (no obligatorias)

- Aktionariat, «acceso»: empezar por «Sí:», como en las otras dos, para que
  responda directamente a la pregunta de Víctor: «Sí: admite a residentes en
  Suiza y el EEE, con un tope total de 100.000 € para el EEE» (85 caracteres).
- Boss Info, mínimo: «precio del 21/11» se lee mejor que «precio a 21/11».
  Pasa también el filtro del vigía.
- Switzerlend: al emisor solo le quedan 57 acciones en el contrato de venta
  (unos 3.900 CHF pagando en cripto). Por transferencia puede entregar más,
  pero no se publica. Puede ir como referencia en la ficha.

## Para la entrega (no es de este grupo)

- Boss Info y Switzerlend se publican hoy con «Condiciones pendientes de nueva
  revisión» (`estado_revision: no_verificable`, `disponible_es: null`). Con lo
  comprobado hoy (abiertas, precio, libro, acceso Suiza + EEE), la entrega puede
  devolverlas a «actual». `disponible_es` en «secundario» depende de una regla de
  la base de datos.

## Bloqueos

- No probé ni el registro ni el KYC (prohibido). No pulsé nada en los portales:
  solo los cargué. La comisión del 1,9 % la confirmé en la API, en el contrato y
  en los propios recibos de hoy, no en la pestaña «Sell».
- Nadie publica cuánto queda del tope de 100.000 € del EEE: el «sí» de España
  puede dejar de valer sin aviso.
- No leí los estatutos de Switzerlend: no se sabe qué clases van por delante
  de C1.
- Para Boss Info y Switzerlend, el acceso Suiza + EEE sale de la plantilla común
  de condiciones de Aktionariat servida en el portal de cada emisor (el mismo
  archivo en los tres). Las webs propias no lo repiten.

## Copias

`fuentes/suiza/`: textos y capturas de las nueve páginas renderizadas, aviso
legal, términos, condiciones del portal, extractos de las webs de Boss Info y
LEND y del Token SHA, y un extracto de Zefix sin nombres. En `fuentes/suiza/crudo/`
están las API, la lectura en cadena (`cadena.json`) y las búsquedas de la CNMV y
FINMA. El correo de `bb-BOSS.json` está recortado y borré los PDF, el Zefix
completo, la lista de FINMA y el HTML de las webs de los emisores después de
anotar su SHA-256 en `log.txt`.
