# Brickwise · resumen de la revisión del 05/11/2026

Grupo `brickwise`. Revisé las 12 fichas publicadas de Brickwise entre las
08:01 y las 08:19 UTC. Todas las fuentes son públicas y las leí sin iniciar
sesión. Las copias, la hora, el código HTTP y el SHA-256 de cada consulta
están en `inventario-consultas.json`. Las respuestas crudas de la API
(direcciones de cartera, tokenId y nombres de personas) están en
`fuentes/crudo/`, fuera de Git. En las copias de texto he recortado los
nombres de personas físicas.

El intento anterior de este encargo no dejó nada en `grupos/brickwise/`, así
que descargué todo de nuevo hoy.

A las 08:19 repetí la consulta de la API de activos. La respuesta fue
idéntica byte a byte a la de las 08:01, así que el libro de órdenes no cambió
mientras trabajaba.

## Lo que vale para todo Brickwise (comprobado hoy)

- **Quién vende:** Brickwise Investment GmbH, que es agente vinculado
  nº 80174029 de **Effecta GmbH** en la BaFin. Está activa desde el
  04/08/2021, sin fecha de baja; la BaFin da los datos a 04/11/2026.
  - Effecta es Wertpapierinstitut en la BaFin (BaFin-ID 10133261).
  - En la **CNMV**, Effecta figura con el nº 5003, en libre prestación y solo
    para recibir y transmitir órdenes. No tiene agentes notificados en España.
  - Todo esto es igual que el 03/11.
- **Advertencias:** la CNMV no tiene advertencias para Brickwise, Effecta,
  BrickOne, Brick Qogir, Brick Sagarmatha, Green-Point, Cohotel ni Brickwise
  Real Estate. Comprobé que el buscador funciona: con «Trading» sí devuelve
  entidades advertidas. La FMA austriaca da 0 resultados para Brickwise,
  Effecta, Brick Qogir y BrickOne, y su buscador también funciona.
- **Documentos:** volví a descargar los 43 PDF: contratos, KID,
  Informationsblätter, el contrato de alquiler de BILLA, los costes, la
  información de Effecta y el desistimiento de BILLA. **Los 43 tienen el mismo
  SHA-256 que el 03/11**, así que ninguno ha cambiado.
- **Nuevo en las fichas:** cada activo enlaza en la API su propio aviso de
  desistimiento (`Rücktrittsbelehrung`, versión del 10/07/2026). Todos dicen lo
  mismo: **comprar en reventa no da derecho de desistimiento**. Lo añado como
  dato de la ficha completa, no de la tarjeta.
- **Comisión:** 1,5 % en cada operación, según los costes publicados y la API
  de comisiones (`fees: 0.015`).
- **Acceso desde España:** según la FAQ (mismo texto que el 03/11), puede
  abrir cuenta cualquier residente del EEE. No consta que cada emisión se
  distribuya en España, y los documentos solo están en alemán →
  `no_confirmado`.
  - El texto publicado de «Acceso desde España» tiene 131 caracteres. Propongo
    uno de 116 que dice lo mismo: «Sin confirmar: cuenta para residentes del
    EEE (España incluida); no consta que esta emisión se distribuya en
    España.».

## Las 11 de reventa → actualizar

Las 11 siguen solo en reventa (`stage=secondary`) y **todas siguen teniendo
vendedores**. El precio de la tabla es el «Preis pro Anteil ab €» del mercado
de la app, que coincide con la venta más barata de la API. Leído el 05/11 a
las 08:01–08:03 UTC.

| Ficha | Venta más barata 03/11 → 05/11 | En venta | Mejor compra 03/11 → 05/11 |
|---|---|---|---|
| Plüddemanngasse 101 (Graz) | **80 → 75 €** (2 a ese precio) | 333 → 335 | 20 € → 20 € |
| Sonnleithnergasse 2 (Viena) | 75 € → 75 € | 96 → 97 | **69 € → 65 €** |
| Estanco Klagenfurt | 95 € → 95 € | 301 → 302 | **88 € → 15 €** |
| Stallhofstraße 28 (Gratwein) | 69,90 € → 69,90 € | 313 | 30 € → 30 € |
| Schwarzer Weg 18 (Graz) | **69,90 → 66,67 €** (6, orden de hoy) | 299 → 305 | 60 € → 60 € |
| Drautalresidenz (Paternion) | 70 € → 70 € | 150 | 54 € → 54 € |
| Randhartingergasse 9 (Viena) | 78 € → 78 € | 184 | 40,50 € → 40,50 € |
| Hinterstoder 50 | **72 → 77 €** (ya no hay órdenes a 72 €) | 263 → 258 | 65 € → 65 € |
| Pottendorfer Straße 62 | **78 → 74 €** (1, orden de hoy) | 127 → 107 | **63 € → 50 €** |
| Fotovoltaica GreenPoint | 100 € → 100 € | 351 | **90 € → 89 €** |
| Fotovoltaica Cohotel | 110 € → 110 € | 65 | 3 € → 3 € |

La API solo muestra las órdenes abiertas. Por eso no se sabe si las que han
desaparecido desde el 03/11 se ejecutaron o se retiraron. Es el caso de la
compra a 88 € de Klagenfurt o de las ventas a 72 € de Hinterstoder.

**Qué cambia en las tarjetas:**

- **Mínimo:** cambia el precio en 4 fichas:
  - Plüddemanngasse: «1 participación desde 75 € en reventa (05/11)»;
  - Schwarzer Weg: 66,67 €;
  - Hinterstoder 50: 77 €;
  - Pottendorfer: 74 €.

  En las otras 7 el precio es el mismo y solo cambia la fecha a 05/11. Ese
  precio es de reventa y del día; no es precio de emisión.
- **Salida:** no cambia. La de Pottendorfer pasa a «Cancelable a los 15 años
  de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de
  comisión)», porque la publicada tenía 125 caracteres.
- **Avisos con fecha:** todos siguen vigentes, porque la descripción del
  alquiler en la API es la misma que el 03/11. Propongo redactar mejor
  algunos:
  - **Plüddemanngasse:** «La API describe un alquiler que terminó el
    31/07/2024 y no informa de otro…». Sustituye a «cita un contrato ya
    vencido».
  - **Schwarzer Weg:** lo mismo, con la fecha 30/08/2023.
  - **Pottendorfer:** lo mismo, con la fecha 30/11/2025. El aviso de la
    garantía registral pendiente sigue igual (la API dice «noch ausstehend»).
  - **Sonnleithnergasse:** la tarjeta publicada pone la fecha en formato ISO
    («2026-11-29»). Texto nuevo: «La API fija el fin del alquiler el
    29/11/2026, pero su texto dice que el contrato se rescindió el 30/09/2023
    y se busca inquilino; la rentabilidad no se muestra».
  - **Stallhofstraße:** el aviso de las dos fechas (02/02/2022 y 31/03/2027)
    se queda igual.
  - **Randhartingergasse:** el aviso del inquilino que se fue el 28/02/2026 y
    de que se busca otro se queda igual.
  - **GreenPoint y Cohotel:** el aviso de reembolso subordinado se queda
    igual (mismo KID).
- **Rentabilidad:** no se muestra (son tarjetas de reventa). El «% p.a.» de la
  app se calcula sobre la venta más barata, y en 5 fichas la base del
  alquiler no está al día. Queda anotado en los claims.
- **Se mantienen en «secundario».** Agruparlas en una sola tarjeta «Brickwise
  · reventa» sigue siendo una opción para Víctor.
- **Randhartingergasse:** sigue la anomalía `availableBricks=374` con la
  emisión cerrada desde 2022. La portada suma 558 participaciones «en venta».
  No la interpreto como una reapertura.

## BILLA (terreno-con-arrendamiento-billa) · en camino → actualizar

- **Sigue abierta en la app:** está en «Neue Objekte», con el botón «+
  Weitere Anteile kaufen», un mínimo de 1.000 € y 100 € por participación.
  Quedan 6.322 de 6.404 participaciones.
- **Avance:** **82 participaciones suscritas de las 5.000 necesarias**
  (8.200 € de 500.000 €, el 1,64 %).
  - Es la misma cifra que el 01/11 y el 03/11.
  - Entre el 06/10 y el 21/10 había 62.
  - Si no se llega al mínimo, se devuelve el dinero sin intereses.
- **Plazo y prórroga:**
  - El plazo publicado terminó el 16/05/2026 a las 23:59.
  - La API sigue con `issueEndDate = issueEndDateOriginal`, es decir, no
    registra ninguna prórroga.
  - El contrato (§4.3) permite prorrogar el plazo de 3 meses como mucho el
    triple de esa duración. Según nuestra lectura, eso llega hasta el
    16/02/2027, pero Brickwise no publica la fecha.
- **Desistimiento:** hay 14 días para desistir de la suscripción, salvo que
  antes te entreguen los tokens. Lo concede el emisor y no existe en la
  reventa. El documento tiene fecha del 10/07/2026 y el mismo SHA-256 que el
  03/11.
- **Sin cambios:**
  - el emisor tenía fondos propios negativos (unos −83.000 €) a 31/12/2024;
  - la garantía en el registro sigue pendiente;
  - el contrato de alquiler sigue siendo solo una imagen de 2012;
  - la app sigue anunciando repartos «desde el 14/07/2026», una fecha ya
    pasada, y no ha podido haber ninguno porque la emisión no se ha
    ejecutado.
- **Cambios en la tarjeta:**
  - el aviso del mínimo se re-fecha al 05/11 y se aclara que el 1,64 % es
    del mínimo;
  - la métrica «Suscrito / umbral» pasa a «(API 05/11/2026)»;
  - el texto de acceso se acorta a 116 caracteres.
- **Resta confianza.** El 03/11 se fijó mediados de noviembre como punto de
  control. Si el 15/11 sigue en 82, propongo retirarla (decide Víctor).

## ¿Hay una emisión primaria nueva? No

- Hoy BILLA es el único activo con `stage=primary`, tanto en la API v2 como en
  la launchpad.
- En el mercado, «Neue Objekte» solo muestra BILLA.
- La portada de brickwise.at sigue con «Neue Immobilie: coming soon», sin
  ningún dato.
- La API v1 lista además «Oskars Hundehütte» (KTGG-0944), pero con
  `stage=test`: es un objeto de pruebas, no una oferta.
- La fotovoltaica de St. Pölten (AT0000A3E842) sigue igual que el 03/11:
  - 219 de 460 participaciones disponibles;
  - «ab 507,62 €»;
  - ninguna orden de reventa;
  - la respuesta de la API es idéntica.

  Se queda en `no_admitir` (expediente del 03/11): su contrato solo permitía
  suscribir en 2024.

→ No hay ninguna candidata nueva.

## Observación para el coordinador

Hoy, en línea, las 12 fichas de Brickwise aparecen como `no_verificable`. Por
eso el visitante solo ve «Condiciones pendientes de nueva revisión» y «Cifras
pendientes de nueva revisión», además de los avisos. La vista
`catalogo_ofertas_publicas` oculta el resumen y las métricas cuando
`estado_revision ≠ 'actual'`. Las cifras de hoy sí son verificables. El estado
editorial lo decide el coordinador.

## Bloqueos y conflictos

- **Firmenbuch austriaco:** es de pago. Los números FN vienen de los
  documentos y de la API.
- **`sharePrice`:** no hay metodología publicada.
- **Órdenes:** no se sabe si se puede comprar solo una parte de una orden de
  venta. Tampoco se sabe si las órdenes que han desaparecido se ejecutaron o
  se retiraron.
- **BILLA:**
  - no hay fecha de prórroga publicada y la API no registra ninguna;
  - el contrato de alquiler solo existe como imagen;
  - sin sesión no se puede comprobar que una suscripción se acepte de verdad.
- **Ficha de BILLA en la app:** la URL directa da «404». Solo se abre
  pulsando la tarjeta del mercado. Pasaba igual el 03/11.
