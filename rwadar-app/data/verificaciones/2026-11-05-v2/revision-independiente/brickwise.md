# Revisión independiente · grupo Brickwise · 05/11/2026

Revisor independiente; no preparé estos expedientes. Entre las **08:22 y las
08:32 UTC** abrí yo mismo todas las fuentes, sin iniciar sesión: las API de
Brickwise, el mercado de la app con Playwright, la ficha de BILLA, los 54 PDF,
la FAQ, la portada, la CNMV, la BaFin y la FMA. Copias, hora, código HTTP y
SHA-256 de cada consulta:
[`fuentes/brickwise/inventario-consultas.json`](fuentes/brickwise/inventario-consultas.json).
Las respuestas crudas de la API (con carteras y tokenId) están en
`fuentes/brickwise/crudo/`, fuera de Git. En los textos he recortado los
nombres de personas.

**Veredicto global: aprobado con cambios.** Los precios, los avisos, los
documentos y los registros que propone el investigador se sostienen. Hay
**tres correcciones obligatorias** antes de publicar:

1. **«1 participación desde X €»** no se puede comprobar en 7 de las 11 fichas
   de reventa. En ellas, la venta más barata es un lote de varias
   participaciones. Hay que escribir **«Desde X € por participación en reventa
   (05/11)»**, que es lo mismo que dice la app («Preis pro Anteil ab €»).
2. **«Mejor compra» de Schwarzer Weg y de Pottendorfer:** ya no vale. Entre las
   08:01 y las 08:22 desaparecieron las órdenes de compra de 60 € y de 50 €.
3. **El resumen dice que el libro de órdenes no cambió mientras trabajaba.** No
   es cierto: la consulta de control de las 08:19 fue a la API v2, que no trae
   las órdenes (`"offers": null`), y el libro sí cambió.

## 1. Lo común a Brickwise

| Comprobación | Fuente y hora (UTC) | Literal | Resultado |
|---|---|---|---|
| Agente vinculado | BaFin, buscador de agentes vinculados (POST `nameVermittler=Brickwise`), 08:29:16 | «Brickwise Investment GmbH … 80174029 · Effecta GmbH · Florstadt · Tätig ab 04.08.2021 · Tätig bis (vacío) · Meldedatum 29.06.2023»; «Stand der Daten: 04.11.2026» | Confirmado. El 29.06.2023 es la fecha de notificación, no de baja: la columna «Tätig bis» está vacía. |
| Effecta en la BaFin | https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=133261, 08:28:36 | «Wertpapierinstitut · Bafin-ID 10133261 · Anlagevermittlung (§ 2 Abs. 2 Nr. 3 WpIG) 26.06.2021» | Confirmado |
| Effecta en la CNMV | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?numero=5003&tipo=CLP (y vistas 8 y 17), 08:28:23–08:28:44 | «5003 · 11/11/2020»; «Recepción y transmisión de órdenes … Valores negociables»; Agentes: «No se han encontrado datos disponibles» | Confirmado |
| Advertencias de la CNMV | `ResultadoBusqueda?tipo=1&nombre=` con Brickwise, Effecta, Brick Qogir y BrickOne, 08:28:26–08:28:33 | «No hay datos disponibles.» Control con «Trading»: «Página 1 de 16» | Confirmado: no hay advertencias y el buscador funciona |
| FMA (Austria) | https://www.fma.gv.at/en/?s=brickwise y ?s=effecta, 08:31:50–52 | «0 Search results». Control con «investor warning»: 1224 resultados | Confirmado |
| Acceso desde España | https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen, 08:28:07 | «Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» | Confirmado. El texto nuevo de la tarjeta tiene 116 caracteres y dice lo mismo. El publicado tiene 134 caracteres (no 131, como pone el expediente), pero en ambos casos pasa de 120. |
| Comisión | https://api.app.brickwise.at/api/v1/utils/fees, 08:22:01; FAQ «was-kostet-der-handel-am-marktplatz», 08:30:55 | `{"fees":0.015}`; «Vermittlungsgebühr von 1,5 % der jeweiligen Transaktionshöhe» | Confirmado |
| Documentos | Los 54 PDF, descargados de nuevo a las 08:27 | — | **43 con el mismo SHA-256 que el 03/11**, y los 11 `Rücktrittsbelehrung` de reventa idénticos a la copia del investigador (no estaban en el inventario del 03/11). Confirmado. |
| Sin desistimiento en reventa | `…/AT0000A2RAH5_Ruecktrittsbelehrung.pdf`, 08:27 | «2. Kein Rücktrittsrecht am Zweitmarkt … Stand: 10.07.2026» | Confirmado |
| ¿Hay una emisión primaria nueva? | API v2 08:22:00; mercado de la app 08:23:49; portada 08:28:14 | Solo `AT0000A3SE89` tiene `stage=primary`; en «Neue Objekte» solo aparece BILLA; portada: «Neue Immobilie: coming soon» | Confirmado: no hay candidata |

**Precios de la app.** Mi lectura del mercado a las 08:23:49 UTC es
**idéntica, línea a línea**, a la del investigador de las 08:03. La API v2 de
las 08:22 es idéntica byte a byte a la suya. Las 12 fichas de la API v1
(`bwrealestate…/api/v1/asset/<ISIN>`) tienen el mismo SHA-256.

**El libro de órdenes sí cambió hoy.** La API v1 de activos de las 08:22 es
distinta de la de las 08:01. Faltan dos órdenes de compra:

- **Schwarzer Weg:** 1 participación a 60 € (creada el 25/10);
- **Pottendorfer:** 1 participación a 50 € (creada el 26/12/2025 y tocada hoy
  a las 07:49).

A las 08:31:42 repetí la consulta y la respuesta fue idéntica a la de las
08:22.

## 2. Ficha por ficha

En la tabla, «Lote más barato» es el tamaño de la orden de venta más barata en
la API v1 a las 08:22 UTC. La FAQ de Brickwise
(`/support/wie-funktioniert-der-handel-am-marktplatz`, 08:30:54) describe
cada oferta como «bestehend aus Preis pro Anteil und der Anzahl der
angebotenen Wertpapiere», que se elige tal cual y el vendedor vuelve a
confirmar. En ningún sitio dice que se pueda comprar solo una parte. Por eso,
«1 participación desde X €» solo está respaldado cuando hay una orden de 1
participación a ese precio.

| Ficha | Venta más barata (app 08:23 = API 08:22) | Lote más barato | En venta | Mejor compra a las 08:22 | Lo que dice el investigador | Veredicto |
|---|---|---|---|---|---|---|
| Plüddemanngasse 101 | 75 € | 2 (una orden del 04/11) | 335 | 20 € | 80 → 75; 333 → 335; 20 € | Cifras confirmadas; el texto del mínimo hay que cambiarlo |
| Sonnleithnergasse 2 | 75 € | 11 (una orden) | 97 | 65 € | 75; 96 → 97; 69 → 65 | Igual |
| Estanco Klagenfurt | 95 € | 16 en tres órdenes, una de 1 (hoy 05:45) | 302 | 15 € | 95; 88 → 15 | Confirmado |
| Stallhofstraße 28 | 69,90 € | 1 | 313 | 30 € | Idéntico al 03/11 | Confirmado; también comparé con el 03/11 |
| Schwarzer Weg 18 | 66,67 € | 6 (una orden de hoy, 02:06) | 305 | **35 €** (no 60) | 69,90 → 66,67; 299 → 305; mejor compra 60 € | Mínimo: cambiar el texto. Mejor compra: corregir |
| Drautalresidenz | 70 € | 3 (una orden) | 150 | 54 € | Idéntico al 03/11 | Libro idéntico, confirmado; el texto del mínimo hay que cambiarlo |
| Randhartingergasse 9 | 78 € | 21, con una orden de 1 | 184 | 40,50 € | Idéntico al 03/11; `availableBricks=374` | Confirmado |
| Hinterstoder 50 | 77 € | 5 (una orden) | 258 | 65 € | 72 → 77; 263 → 258 | Cifras confirmadas; el texto del mínimo hay que cambiarlo |
| Pottendorfer Str. 62 | 74 € | 1 (hoy, 05:42) | 107 | **19 €** (3 participaciones, orden del 06/11/2025) | 78 → 74; 127 → 107; mejor compra 63 → **50** | Mínimo confirmado. Mejor compra: corregir |
| Fotovoltaica GreenPoint | 100 € | 5 (una orden) | 351 | 89 € | 100; 90 → 89 | Cifras confirmadas; el texto del mínimo hay que cambiarlo |
| Fotovoltaica Cohotel | 110 € | 35 (31 + 4) | 65 | 3 € | Idéntico al 03/11 | Libro idéntico, confirmado; el texto del mínimo hay que cambiarlo |

**Las «sin cambios», comparadas con el resumen del 03/11**
(`../2026-11-03.3-v2/grupos/brickwise-alius-hausera/fuentes/brickwise/libro-ordenes-resumen-2026-11-03.json`).
En las cuatro fichas que el investigador da como «solo se re-fecha», el número
de órdenes de venta y de compra, las participaciones en venta, el precio más
bajo y su cantidad, y la mejor compra son **los mismos** que el 03/11:

- Stallhofstraße: 85/12, 313, 69,90 (1), 30;
- Drautalresidenz: 32/9, 150, 70 (3), 54;
- Randhartingergasse: 31/8, 184, 78 (21), 40,50;
- Cohotel: 5/5, 65, 110 (35), 3.

### Avisos de alquiler y garantía (API por ISIN, 08:22:48–53 UTC, mismo SHA-256 que la copia del investigador)

| Ficha | Literal de hoy | Aviso propuesto | Veredicto |
|---|---|---|---|
| Plüddemanngasse | `rentalDetails`: «Es endet somit am 31.07.2024»; `contractEndDate: 2021-05-10T22:00Z` | «La API describe un alquiler que terminó el 31/07/2024 y no informa de otro…» | Confirmado. Para la ficha completa: el campo `contractEndDate` da otra fecha pasada (11/05/2021). |
| Sonnleithnergasse | `contractEndDate: 2026-11-29T17:00Z`; «Der aktuelle Mietvertrag wurde zum 30. September 2023 gekündigt … Derzeit wird ein Nachmieter gesucht» | «La API fija el fin del alquiler el 29/11/2026, pero su texto dice que el contrato se rescindió el 30/09/2023 y se busca inquilino…» | Confirmado. Recomiendo «terminó el 30/09/2023 por rescisión», porque «gekündigt zum» es la fecha en que termina, no la del aviso. |
| Stallhofstraße | `contractEndDate: 2022-02-01T23:00Z` (02/02/2022 en Austria); «endet am 31.03.2027» | Igual que el publicado | Confirmado |
| Schwarzer Weg | «Das Mietverhältnis endet am 30.08.2023»; `contractEndDate: 2022-02-01T23:00Z` | «…terminó el 30/08/2023 y no informa de otro» | Confirmado |
| Randhartingergasse | «vom Mieter gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht» | Igual que el publicado | Confirmado |
| Pottendorfer | «Das Mietverhältnis endet am 30.11.2025»; «Grundbücherliche Besicherung noch ausstehend.» | «…terminó el 30/11/2025 y no informa de otro»; el aviso de la garantía se queda igual | Confirmado |
| GreenPoint / Cohotel | KID y contrato con el mismo SHA-256; contrato: «Rückzahlungsanspruch (qualifiziert nachrangig)»; KID: «Beendigungszeitpunkt: 31.12.2038» | Reembolso subordinado; salida «Devolución del nominal el 31/12/2038…» (119 caracteres) | Confirmado. La app muestra «Laufzeit 30.12.2038», pero el KID manda. |

### Salida de Pottendorfer

El contrato `contrato-AT0000A324B4.pdf` (mismo SHA-256), en su punto 10.2,
dice: «erstmalig 15 (fünfzehn) Jahre ab dem Ausgabetag und sodann alle weiteren
15 (fünfzehn) Jahre … ordentlich zu kündigen».

El texto propuesto, «Cancelable a los 15 años de la emisión; antes, solo
vendiendo en la app si hay comprador (1,5 % de comisión)», tiene 108
caracteres y está respaldado. Recomiendo **«Primera cancelación a los 15 años
de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de
comisión)»**, de 117 caracteres. Coincide con la métrica «Primera cancelación
a los 15 años» y no da a entender que se pueda cancelar en cualquier momento a
partir de los 15 años: la cancelación solo se abre cada 15 años.

### BILLA (`terreno-con-arrendamiento-billa`, AT0000A3SE89)

**Lo que dicen la API y la app**

- **Suscripción** (API por ISIN, 08:22:53): `availableBricks 6322`,
  `totalBricks 6404` → **82 participaciones suscritas**. Son 8.200 €, el 1,64 %
  de 500.000 €. Confirmado.
- **Plazo** (misma consulta): `issueEndDate = issueEndDateOriginal =
  2026-05-15T22:00Z`, así que la API no registra ninguna prórroga.
  - El Informationsblatt (mismo SHA-256) dice: «Zeichnungsfrist endet am
    16.05.2026 um 23:59 Uhr … maximal jedoch um bis zum dreifachen des
    ursprünglichen Ausgabezeitraums verlängert».
  - El contrato, en su punto 4.3, dice lo mismo.
  - El aviso «el plazo publicado terminó el 16/05/2026…» sigue vigente.
    Confirmado.
- **Sigue a la venta en la app.** La ficha, abierta con un clic desde el
  mercado (08:25:19, captura `captura-app-billa-revisor-2026-11-05.png`),
  muestra «+ Weitere Anteile kaufen», «Mindestinvestition € 1.000,00»,
  «Verfügbare Anteile 6.322» y «Erwartet ab 14.7.2026». Confirmado.
- **Enlace directo:** `/desktopWeb/asset/AT0000A3SE89` da «404 · Diese Seite
  existiert zurzeit nicht» (08:25:09). Confirmado.

**Documentos**

- **Desistimiento:** el documento `AT0000A3SE89_Ruecktrittsbelehrung.pdf`
  (mismo SHA-256 que el 03/11, «Stand: 10.07.2026») da «innerhalb von 14
  Tagen» y termina «sobald die Emittentin die gezeichneten … Wertpapiere an
  dich ausgegeben hat». Confirmado.
  - Además, el contrato da un «vorvertragliche Bedenkzeit von 4 (vier)
    Tagen». No contradice el aviso.
- **Fondos propios negativos** (Informationsblatt): «negatives Eigenkapital in
  Höhe von rund EUR 83.000,00» a 31.12.2024.
- **Garantía en el registro** (API): «Grundbücherliche Besicherung noch
  ausstehend.» Las dos, confirmadas.

**Textos de la tarjeta**

- Mínimo: «1.000 € (10 participaciones de 100 €)».
- Acceso desde España: 116 caracteres.
- Salida: 105 caracteres.

Los tres están en castellano llano, tienen ≤ 120 caracteres y no llevan
rentabilidad.

La propuesta de retirarla si el 15/11 sigue en 82 es razonable. La fuente
también sostendría retirarla ya: el plazo venció hace más de cinco meses y no
hay prórroga publicada. Lo decide Víctor.

## 3. Correcciones obligatorias

1. **Mínimo de inversión en 7 fichas de reventa.** Hay que quitar «1
   participación» y escribir «Desde X € por participación en reventa (05/11)».
   La cifra no cambia. En la ficha completa se puede añadir el tamaño del lote
   (ya figura en `referenciasFicha`: «(N a ese precio)»).

   | Ficha | Texto nuevo del mínimo | Lote más barato |
   |---|---|---|
   | Plüddemanngasse | «Desde 75 € por participación en reventa (05/11)» | 2 |
   | Sonnleithnergasse | «Desde 75 € por participación en reventa (05/11)» | 11 |
   | Schwarzer Weg | «Desde 66,67 € por participación en reventa (05/11)» | 6 |
   | Drautalresidenz | «Desde 70 € por participación en reventa (05/11)» | 3 |
   | Hinterstoder 50 | «Desde 77 € por participación en reventa (05/11)» | 5 |
   | GreenPoint | «Desde 100 € por participación en reventa (05/11)» | 5 |
   | Cohotel | «Desde 110 € por participación en reventa (05/11)» | 31 + 4 |

   En Klagenfurt, Stallhofstraße, Randhartingergasse y Pottendorfer el texto
   «1 participación desde X €» sí está respaldado, porque hay una orden de 1 a
   ese precio. Este mismo defecto ya estaba en lo publicado el 03/11.
2. **Schwarzer Weg.** En `referenciasFicha`, la «Mejor oferta de compra» pasa
   a «35,00 € (1 participación, orden del 01/07/2026)», leída a las 08:22 UTC.
   La alternativa es quitar esa referencia, porque cambia en minutos.
3. **Pottendorfer.** El cambio «mejor compra 63 € → 50 €» no se sostiene. A las
   08:22–08:31 UTC es «19,00 € (3 participaciones, orden del 06/11/2025)». Hay
   que corregir `referenciasFicha` y `cambiosRespectoPublicado`, o quitar la
   referencia.
4. **Resumen del grupo.** Hay que quitar «el libro de órdenes no cambió
   mientras trabajaba»: la consulta de control fue a la API v2, que no trae
   las órdenes, y entre las 08:01 y las 08:22 desaparecieron dos órdenes de
   compra.

**Recomendadas (no bloquean):**

- **Pottendorfer:** salida «Primera cancelación a los 15 años de la
  emisión; …» (117 caracteres).
- **Sonnleithnergasse:** «terminó el 30/09/2023 por rescisión».
- **Plüddemanngasse:** anotar en la ficha completa que `contractEndDate` da
  11/05/2021.

## 4. Bloqueos (siguen igual)

- **Compra parcial:** no hay ninguna fuente pública que diga si se puede
  comprar solo una parte de una orden de venta. La FAQ describe la oferta como
  «precio por participación y número de valores», que se elige entera. Las
  condiciones de uso de la app no están en las rutas públicas que probé:
  `cdn.brickwise.at/legal/…AGB/Nutzungsbedingungen.pdf` da 404.
- **Órdenes que desaparecen:** no se puede saber si las compras de 60 € y de
  50 € se ejecutaron o se retiraron. El `sharePrice` de la API v2 no cambió.
- **Firmenbuch:** es de pago. No lo consulté.
- **BILLA:** sin sesión no se puede comprobar si se acepta de verdad una
  suscripción ni si existe una prórroga sin publicar.
- **Para el coordinador:** en línea, las 12 fichas siguen como
  `no_verificable`, con «Cifras pendientes de nueva revisión». Las cifras de
  hoy sí son verificables, con las correcciones de arriba.
