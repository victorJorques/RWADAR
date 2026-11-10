# Brickwise · resumen de la revisión del 10/11/2026

Grupo `brickwise`. Revisé las 11 fichas de reventa publicadas de Brickwise
entre las 09:01 y las 09:18 UTC. También busqué si hay alguna emisión primaria
nueva. Todo lo leí sin iniciar sesión y desde fuentes públicas: la API de la
app, el mercado de la app (con Playwright), la web, los PDF de cada emisión y
los registros de la BaFin, la CNMV y la FMA.

- **Dónde está cada cosa:** la copia, la hora, el código HTTP y el SHA-256 de
  cada consulta están en `inventario-consultas.json`.
- **Fuera de Git:** las respuestas crudas de la API (con carteras y tokenId),
  los HTML de los registros y los PDF que llevan nombres de personas físicas
  (en el texto o en sus metadatos) están en `fuentes/crudo/`.
- **Nombres recortados:** en las copias de texto los nombres de personas
  físicas aparecen como «[persona física recortada]».

**El libro de órdenes no cambió mientras trabajaba.** Lo leí a las 09:02. A
las 09:17 repetí la consulta en la API v1 (la que trae las órdenes) y en la
v2: las dos respuestas fueron idénticas byte a byte a las de las 09:01–09:02.

## Lo común a Brickwise (todo igual que el 05/11)

- **Quién vende:** Brickwise Investment GmbH, agente vinculado nº 80174029 de
  **Effecta GmbH** en la BaFin.
  - Activa desde el 04/08/2021 y sin fecha de baja; la BaFin da los datos a
    09/11/2026.
  - Effecta es Wertpapierinstitut (BaFin-ID 10133261), con Anlagevermittlung
    y Anlageberatung desde el 26/06/2021.
- **En la CNMV:** Effecta figura con el nº 5003, en libre prestación y solo
  para recibir y transmitir órdenes. En la pestaña «Agentes» pone «No se han
  encontrado datos disponibles».
- **Advertencias:** ninguna.
  - La CNMV no tiene advertencias para Brickwise, Effecta, Brick Qogir,
    BrickOne, Brick Sagarmatha, Green-Point, Cohotel ni Brickwise Real Estate.
    El buscador funciona: con «Trading» devuelve «Página 1 de 16».
  - La FMA da 0 resultados para brickwise, effecta, brick qogir, brickone y
    brick sagarmatha. Su buscador también funciona: «investor warning»
    devuelve 1.224 resultados.
- **Documentos:** volví a descargar 55 PDF: contrato, KID, Informationsblatt y
  desistimiento de cada emisión, el contrato de alquiler de BILLA, los costes
  y la información de Effecta. **54 tienen el mismo SHA-256 que el 05/11**, así
  que no han cambiado. El otro es el desistimiento de St. Pölten, que no
  estaba en el inventario del 05/11.
- **Comisión:** 1,5 % en cada compra y en cada venta. Lo dicen la API
  (`fees: 0.015`), los costes publicados y la FAQ («Vermittlungsgebühr von
  1,5 % der jeweiligen Transaktionshöhe»).
- **Acceso desde España:** la FAQ dice lo mismo que el 05/11: puede abrir
  cuenta cualquier residente del EEE. Pero no consta que cada emisión se
  distribuya en España, y los documentos solo están en alemán →
  `no_confirmado`.
- **Comprar solo una parte de una orden:** la FAQ del mercado dice que cada
  oferta se elige con su precio y su número de participaciones. En ningún
  sitio dice que se pueda comprar solo una parte de una orden.

## Las 11 de reventa → actualizar

Las 11 siguen solo en reventa (`stage=secondary`) y todas siguen teniendo
vendedores. El precio de la tabla es el «Preis pro Anteil ab €» del mercado de
la app (09:06 UTC), que coincide con la venta más barata de la API (09:02
UTC).

| Ficha | Venta más barata 05/11 → 10/11 | En venta | Mejor compra 05/11 → 10/11 |
|---|---|---|---|
| Plüddemanngasse 101 (Graz) | 75 € → 75 € (2) | 335 | 20 € → 20 € |
| Sonnleithnergasse 2 (Viena) | 75 € → 75 € (11) | 97 | 65 € → 65 € |
| Estanco Klagenfurt | 95 € → 95 € (16, en 3 órdenes) | 302 | 15 € → 15 € |
| Stallhofstraße 28 (Gratwein) | **69,90 → 68,80 €** (1, orden del 08/11) | 313 → 317 | 30 € → 30 € |
| Schwarzer Weg 18 (Graz) | **66,67 → 65 €** (1, orden del 09/11) | 305 → 300 | 35 € → 35 € |
| Drautalresidenz (Paternion) | 70 € → 70 € (3) | 150 | **54 € → 60 €** (orden del 05/11) |
| Randhartingergasse 9 (Viena) | 78 € → 78 € (21, en 2 órdenes) | 184 → 189 | **40,50 € → 46 €** (orden del 09/11) |
| Hinterstoder 50 | **77 → 75 €** (5, orden del 08/11) | 258 → 265 | **65 € → 20 €** (ya no está la de 65 €) |
| Pottendorfer Straße 62 | 74 € → 74 € (1; es otra orden, del 09/11) | 107 | 19 € → 19 € |
| Fotovoltaica GreenPoint | 100 € → 100 € (5) | 351 | **89 € → 84 €** |
| Fotovoltaica Cohotel | 110 € → 110 € (35, en 2 órdenes) | 65 | 3 € → 3 € |

La columna de 05/11 es lo publicado. En Pottendorfer (19 €) y Schwarzer Weg
(35 €), la mejor compra coincide hoy con la corrección que hizo el revisor el
05/11.

La API solo muestra las órdenes abiertas. Por eso no se sabe si las que han
desaparecido se ejecutaron o se retiraron. Es el caso de la compra a 65 € de
Hinterstoder y de la venta a 74 € de Pottendorfer del 05/11.

**Qué cambia en las tarjetas:**

- **Mínimo:** cambia el precio en 3 fichas:
  - Stallhofstraße: «Desde 68,80 € la participación en reventa (10/11)»;
  - Schwarzer Weg: «Desde 65 € la participación en reventa (10/11)»;
  - Hinterstoder 50: «Desde 75 € la participación en reventa (10/11)».

  En las otras 8 el precio es el mismo y solo cambia la fecha a (10/11). Es un
  precio de reventa del día, no de emisión.
- **Acceso desde España y salida:** no cambian.
- **Avisos:** todos siguen vigentes, con fuente y hora de hoy en
  `revisionAvisos`.
  - Los textos del alquiler en la API son los mismos que el 05/11:
    - Plüddemanngasse: terminó el 31/07/2024;
    - Sonnleithnergasse: rescindido el 30/09/2023, se busca inquilino, y
      `contractEndDate` del 29/11/2026;
    - Stallhofstraße: dos fechas, 02/02/2022 y 31/03/2027;
    - Schwarzer Weg: terminó el 30/08/2023;
    - Randhartingergasse: el inquilino se fue el 28/02/2026;
    - Pottendorfer: terminó el 30/11/2025.
  - La garantía de Pottendorfer sigue «noch ausstehend».
  - El reembolso subordinado de GreenPoint y Cohotel sigue igual (mismo KID).
- **Ficha completa:** se actualizan la venta más barata, las participaciones
  en venta y la mejor compra, con fecha del 10/11.
- **Solo en el expediente:** cambian `sharePrice` y `rentalReturn` en 4
  fichas: Hinterstoder, GreenPoint, Pottendorfer y Schwarzer Weg. No se
  publican.
- **Rentabilidad:** no se muestra, porque son tarjetas de reventa.
- **Se mantienen en «secundario».**
- **Randhartingergasse:** sigue la anomalía `availableBricks=374`. La portada
  suma hoy 563 participaciones «Verfügbare Anteile» (374 + 189). No la
  interpreto como una reapertura.

## ¿Hay una emisión primaria abierta hoy? Solo BILLA, y no se propone

- En la API v2 y en la launchpad, el único activo con `stage=primary` es
  **BILLA** (AT0000A3SE89). En el mercado de la app, «Neue Objekte» solo
  muestra BILLA, y la portada sigue con «Neue Immobilie: coming soon».
- La busqué en la prensa (WebSearch) y no encontré ninguna emisión nueva
  anunciada. La búsqueda solo sirvió para descubrir; manda la API.
- He hecho su expediente como candidata
  (`expedientes/terreno-con-arrendamiento-billa.json`) → **`no_admitir`**.
  Está exactamente igual que cuando Víctor la retiró el 05/11:
  - **82 de las 5.000 participaciones necesarias** (8.200 €, el 1,64 % del
    mínimo de 500.000 €), igual desde el 29/10;
  - plazo publicado vencido el 16/05/2026 y la API sin prórroga
    (`issueEndDate` igual a `issueEndDateOriginal`);
  - los mismos documentos, con el mismo SHA-256;
  - fondos propios negativos del emisor a 31/12/2024 y la garantía en el
    registro aún pendiente.

  La app la sigue ofreciendo («+ Weitere Anteile kaufen», 6.322 de 6.404
  disponibles, mínimo de 1.000 €).
- **Sin cambios, en una línea cada una:**
  - **Fotovoltaica de St. Pölten (AT0000A3E842):** `stage=secondary`, 219 de
    460 participaciones «disponibles» y ninguna orden de reventa. La
    respuesta de la API es idéntica a la del 05/11. Sigue en `no_admitir`
    (expediente del 03/11): su contrato solo permitía suscribir en 2024.
    Novedad menor: la API ya enlaza su hoja de desistimiento.
  - **Ferienimmobilie mit Fixpacht, Hinterstoder (AT0000A35A42):** solo
    reventa (68 participaciones desde 94,90 €). Sigue en `no_admitir`
    (expediente del 01/11).

## Observación para el coordinador

En línea (lectura pública de las 08:58 UTC), las 11 fichas de Brickwise
siguen como `no_verificable`. Por eso el visitante no ve el mínimo, el acceso
ni la salida. Las cifras de hoy sí se han podido comprobar. El estado
editorial lo decide el coordinador.

## Bloqueos y conflictos

- **Firmenbuch austriaco:** es de pago. Los números FN vienen de los
  documentos y de la API.
- **`sharePrice`:** no hay metodología publicada.
- **Órdenes:**
  - no se sabe si se puede comprar solo una parte de una orden;
  - no se sabe si las órdenes que desaparecen se ejecutaron o se retiraron.
- **Ficha por ISIN (API v1):** en 4 de las 11 fichas (Hinterstoder,
  GreenPoint, Pottendorfer y Schwarzer Weg) tiene hoy un SHA-256 distinto del
  05/11, con el mismo tamaño. La copia del 05/11 no se conserva (estaba fuera
  de Git), así que solo comparé los campos que usamos:
  - los enlaces a los documentos son iguales;
  - en Schwarzer Weg y Pottendorfer, el texto del alquiler y la garantía
    también son iguales;
  - cambian `sharePrice` y `rentalReturn`.

  En las otras 7 fichas, la respuesta es idéntica byte a byte.
- **BILLA:** no hay fecha de prórroga publicada, y sin sesión no se puede
  comprobar que la app acepte de verdad una suscripción.
