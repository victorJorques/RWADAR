# Brickwise · puesta al día del 12/11/2026

Grupo `brickwise`, 11 fichas de reventa publicadas. Consultas entre las 00:32 y
las 00:36 UTC del 12/11/2026, con `curl` (y Playwright solo para el mercado de la
app). Todo sin sesión, sin cuenta y sin formularios.

## En una frase

Las 11 siguen solo en reventa y con vendedores. Cambia el mínimo de **3**:
Pottendorfer Straße (73 → **80 €**), GreenPoint (100 → **102 €**) y Cohotel
(110 → **102 €**). En las otras 8 el precio es el mismo y solo cambia la fecha
a (12/11). Los 46 PDF tienen el mismo SHA-256 que ayer. La CNMV no tiene
advertencias nuevas.

## Mínimo de la tarjeta y orden más barata (API pública, 00:32:59 UTC)

Fuente: `https://api.app.brickwise.at/api/v1/assets` (órdenes abiertas), igual
que `lowestOfferPrice` de la v2 y que «Preis pro Anteil ab» del mercado de la
app (00:35 UTC).

| Ficha | Mínimo publicado (11/11) | Mínimo propuesto (12/11) | Venta más barata hoy | Orden de menor importe (+1,5 %) |
|---|---|---|---|---|
| Hinterstoder 50 | 75 € | 75 € | 5 a 75 € (orden del 08/11) | 1 a 90 € → 91,35 € |
| Drautalresidenz | 70 € | 70 € | 3 a 70 € (18/10) | 1 a 84 € → 85,26 € |
| **Cohotel** | 110 € | **102 €** | 1 a 102 € (11/11) | 1 a 102 € → 103,53 € |
| **GreenPoint** | 100 € | **102 €** | 8 a 102 € en 3 órdenes (5, 2, 1) | 1 a 102 € → 103,53 € |
| Klagenfurt | 95 € | 95 € | 16 a 95 € en 3 órdenes (5, 10, 1) | 1 a 95 € → 96,42 € |
| Randhartingergasse | 78 € | 78 € | 21 a 78 € en 2 órdenes (20, 1) | 1 a 78 € → 79,17 € |
| Plüddemanngasse | 75 € | 75 € | 2 a 75 € (04/11) | 1 a 99 € → 100,48 € |
| **Pottendorfer** | 73 € | **80 €** | 11 a 80 € (08/02) | 1 a 115 € → 116,72 € |
| Schwarzer Weg | 69,90 € | 69,90 € | 1 a 69,90 € (27/10) | 1 a 69,90 € → 70,95 € |
| Sonnleithnergasse | 75 € | 75 € | 11 a 75 € (28/04) | 1 a 80 € → 81,20 € |
| Stallhofstraße | 68,80 € | 68,80 € | 1 a 68,80 € (08/11) | 1 a 68,80 € → 69,83 € |

Texto del mínimo: «Desde X € la participación en reventa (12/11)».

Qué ha pasado en las tres que cambian (la API solo enseña órdenes abiertas, así
que no se sabe si las que faltan se vendieron o se retiraron):

- **Pottendorfer:** ya no está la orden de 1 a 73 € de ayer. La siguiente es de
  11 a 80 €. Si no se puede comprar solo una parte, la orden más pequeña es 1 a
  115 €.
- **GreenPoint:** ya no está la orden de 5 a 100 €. Hay una nueva de 1 a 102 €.
- **Cohotel:** hay una orden nueva de 1 a 102 € (de ayer por la tarde). Ayer no
  había ninguna orden de 1; ahora sí.

Total del tablón: 422 ventas y 95 compras abiertas, todas `contactType
"bulletin"`. Dos órdenes baratas tienen ya un interesado apuntado, sin bloqueo
activo: la de 20 a 78 € en Randhartingergasse y la de 2 a 102 € en GreenPoint.

## Aviso común propuesto para las 11 fichas

> Cada venta se anuncia con su precio y su número de participaciones; no consta
> que se pueda comprar solo una parte. El comprador paga además un 1,5 % de
> comisión.

Respaldo leído hoy:

- FAQ «Wie funktioniert der Handel am Marktplatz?» (00:33:22 UTC): la oferta
  consta de «Preis pro Anteil und der Anzahl der angebotenen Wertpapiere» y se
  elige entera. No dice si se puede tomar una parte.
- Kosteninformationen (mismo SHA-256): 1,50 % para comprador y vendedor. La API
  de comisiones da `"fees":0.015`.
- Las condiciones de uso (29.09.2021) y el JS público de la app tienen el mismo
  SHA-256 que ayer. Ninguno resuelve la compra parcial: **sigue sin confirmar**.

Va en `propuestaTarjeta.avisos`, antes del aviso de «Los precios y el libro de
órdenes cambian a diario».

## Lo que no cambia (con la consulta de hoy)

- **Documentos:** contrato, KID, hoja informativa y Rücktrittsbelehrung de cada
  emisión, y Kosteninformationen: mismo SHA-256 que el 11/11 (copias en
  `fuentes/crudo/pdf/`, fuera de Git).
- **Fichas de la API por emisión:** iguales a ayer salvo Klagenfurt, donde solo
  cambian `sharePrice` (88 → 90), `rentalReturn` (3,73 → 3,65) y `updatedAt`.
  No se publican.
- **Avisos del alquiler** (Plüddemanngasse, Pottendorfer, Randhartingergasse,
  Schwarzer Weg, Sonnleithnergasse, Stallhofstraße) y **garantía pendiente**
  de Pottendorfer: el texto de la API es el mismo. Siguen vigentes.
- **Acceso desde España:** la FAQ sigue diciendo que puede abrir cuenta
  cualquiera con residencia en el EEE. No consta que cada emisión se distribuya
  en España. Se queda «Sin confirmar».
- **Salida:** sin cambios (vender en el tablón si hay comprador; Cohotel y
  GreenPoint devuelven el nominal el 31/12/2038, subordinado; Pottendorfer, primera
  cancelación a los 15 años).

## Registros y advertencias

- **CNMV, EFFECTA GmbH n.º 5003:** libre prestación desde el 11/11/2020, país de
  origen Alemania; solo «Recepción y transmisión de órdenes» sobre valores
  negociables y participaciones de IIC. Agentes: «No se han encontrado datos
  disponibles». Igual que ayer.
- **BaFin:** Effecta GmbH (BaFin-ID 10133261), Wertpapierinstitut con
  Anlagevermittlung y Anlageberatung desde el 26.06.2021; Brickwise Investment
  GmbH, agente vinculado n.º 80174029 de Effecta desde el 04.08.2021, sin fecha
  de baja. «Stand der Daten: 11.11.2026».
- **Advertencias de la CNMV:** sin coincidencias para Brickwise, Effecta, Brick
  Qogir, Brick Sagarmatha, BrickOne, Cohotel y Green-Point/Green Point. El
  buscador funciona: «Trading» da «Página 1 de 16».

## Decisión

`actualizar` en las 11: nuevo mínimo en 3, nueva fecha en 8 y el aviso común en
todas. Siguen en «secundario». No se propone retirar ninguna.

## Bloqueos y límites

- No se sabe si se puede comprar solo una parte de una orden. Ninguna fuente
  pública lo confirma ni lo descarta.
- La API solo enseña órdenes abiertas: no se sabe si las que desaparecen se
  vendieron.
- El precio publicado no garantiza la compra. Muchas ventas tienen más de un
  año.
- FMA (Austria): no se repitió hoy. Última lectura del 11/11, sin coincidencias.
  `curl` recibe 403 de Cloudflare.
- Firmenbuch: no consultado (es de pago).

## Archivos

- Expedientes: `../../expedientes/<slug>.json` (11).
- Resumen del libro de órdenes sin direcciones:
  `fuentes/libro-ordenes-resumen-2026-11-12.json`.
- Textos leídos: `fuentes/web/` y `fuentes/reguladores/` (nombres de personas
  recortados). Crudos, PDF y JS: `fuentes/crudo/` (fuera de Git).
- Inventario: `inventario-consultas.json`.
