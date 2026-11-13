# Brickwise · puesta al día del 13/11/2026

Grupo `brickwise`, 11 fichas de reventa publicadas. Consultas entre las 08:30
y las 08:37 UTC del 13/11/2026, con `curl` (y Playwright solo para el mercado
de la app y para intentar la FMA). Todo sin sesión, sin cuenta y sin
formularios.

## En una frase

Las 11 siguen solo en reventa y con vendedores. Cambia el mínimo de **una**:
Pottendorfer Straße (80 → **73 €**), porque anoche apareció una venta nueva
de 1 participación a 73 €. En las otras 10 el precio es el mismo y solo cambia
la fecha a (13/11). Los 46 PDF tienen el mismo SHA-256 que ayer. La CNMV no
tiene advertencias nuevas.

## Orden de venta más barata de cada ficha (API pública, 08:30:44 UTC)

Fuente: `https://api.app.brickwise.at/api/v1/assets` (órdenes abiertas). Da
lo mismo que `lowestOfferPrice` de la v2 (misma hora) y que «Preis pro Anteil
ab» del mercado de la app (texto leído a las 08:33:24 UTC).

| Ficha | Venta más barata | Cantidad a ese precio (fecha de la orden) | Orden de menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|---|
| Hinterstoder 50 | 75,00 € | 5 en 1 orden (08/11) | 1 a 90,00 € → 91,35 € | 265 | 20,00 € |
| Drautalresidenz | 70,00 € | 3 en 1 orden (18/10) | 1 a 84,00 € → 85,26 € | 150 | 60,00 € |
| Cohotel | 102,00 € | 1 en 1 orden (11/11) | 1 a 102,00 € → 103,53 € | 59 | 3,00 € |
| GreenPoint | 102,00 € | 8 en 3 órdenes: 5 (05/09), 2 (28/09), 1 (11/11) | 1 a 102,00 € → 103,53 € | 347 | 84,00 € |
| Klagenfurt | 95,00 € | 16 en 3 órdenes: 5 (21/03), 10 (30/03), 1 (05/11) | 1 a 95,00 € → 96,43 € | 302 | 15,00 € |
| Randhartingergasse | 78,00 € | 21 en 2 órdenes: 20 (29/06), 1 (02/11) | 1 a 78,00 € → 79,17 € | 189 | **64,00 €** |
| Plüddemanngasse | 75,00 € | 2 en 1 orden (04/11) | 1 a 99,00 € → 100,49 € | 335 | 20,00 € |
| **Pottendorfer** | **73,00 €** | **1 en 1 orden (12/11)** | **1 a 73,00 € → 74,10 €** | 107 | 19,00 € |
| Schwarzer Weg | 69,90 € | 1 en 1 orden (27/10) | 1 a 69,90 € → 70,95 € | 299 | 60,00 € |
| Sonnleithnergasse | 75,00 € | 11 en 1 orden (28/04) | 1 a 80,00 € → 81,20 € | 97 | 65,00 € |
| Stallhofstraße | 68,80 € | 1 en 1 orden (08/11) | 1 a 68,80 € → 69,83 € | 317 | 30,00 € |

Los importes con el 1,5 % están redondeados al céntimo con la mitad hacia
arriba (así los corrigió la revisión de ayer: 96,43, 100,49).

Texto del mínimo en las 11: «Desde X € la participación en reventa (13/11)».

## Qué cambia frente a lo publicado (12/11)

Entre ayer (00:32 UTC) y hoy (08:30 UTC) el tablón solo se movió en dos
fichas. Total: 423 ventas abiertas (ayer 422) y 95 compras (igual), todas
`contactType "bulletin"`.

- **Pottendorfer Straße 62 (cambio de mínimo):** hay una venta nueva de 1
  participación a 73 €, creada el 12/11 a las 21:45 UTC.
  - Mínimo: «Desde 80 € … (12/11)» → «Desde **73 €** … (13/11)».
  - Venta más barata: 80,00 € (11, orden del 08/02/2026) → 73,00 € (1, orden
    del 12/11/2026).
  - Orden de menor importe: 1 a 115,00 € (116,73 €) → 1 a 73,00 € (74,10 €).
    Como es de 1 participación, ese importe no depende de poder comprar solo
    una parte.
  - La app lo confirma: «Preis pro Anteil ab € 73,00».
- **Randhartingergasse 9:** desaparece la compra de 1 a 56 € (10/11) y aparece
  otra de 1 a 64 € (12/11). «Mejor oferta de compra»: 56,00 € → **64,00 €**
  (1 participación, orden del 12/11/2026). La venta más barata no cambia.
- Las otras 9: el libro de órdenes es el mismo que ayer. Solo cambia la fecha.

## Las 4 fichas con «Participaciones en venta» atrasada

Ayer se quedaron con su fecha anterior porque la cifra había cambiado. Hoy hay
dato de la API (v1 y v2 coinciden):

| Ficha | Publicado | Hoy (13/11/2026) |
|---|---|---|
| Cohotel | 65 (11/11/2026) | **59** |
| GreenPoint | 351 (11/11/2026) | **347** |
| Pottendorfer | 107 (11/11/2026) | 107 (la misma cifra; solo cambia la fecha) |
| Schwarzer Weg | 300 (10/11/2026) | **299** |

Se proponen las 4 al día, con la etiqueta «Participaciones en venta ·
13/11/2026». Las otras 7 tienen la misma cifra que ayer y solo cambia la fecha.

## Aviso común

> Cada venta se anuncia con su precio y su número de participaciones; no consta
> que se pueda comprar solo una parte. El comprador paga además un 1,5 % de
> comisión.

Sigue igual y vigente en las 11:

- La FAQ «Wie funktioniert der Handel am Marktplatz?» tiene el mismo SHA-256
  que ayer (08:30:49 UTC).
- Kosteninformationen, igual (08:30:46 UTC): 1,50 % para comprador y vendedor.
  La API de comisiones sigue en `"fees":0.015` (08:30:44 UTC).
- Las condiciones de uso (29.09.2021) y el JS público de la app
  (`app.85dda63a.js`, la misma versión que carga hoy la web) tienen el mismo
  SHA-256 que ayer. La compra parcial **sigue sin confirmar**.

## Lo que no cambia (con la consulta de hoy)

- **Documentos:** contrato, KID, hoja informativa y Rücktrittsbelehrung de cada
  emisión, y Kosteninformationen: mismo SHA-256 que el 12/11 (46 PDF; copias
  en `fuentes/crudo/pdf/`, fuera de Git).
- **Fichas de la API por emisión:** 10 iguales byte a byte. En Pottendorfer
  solo cambia `updatedAt`. No se publica nada de ellas que cambie.
- **Avisos del alquiler** (Plüddemanngasse, Pottendorfer, Randhartingergasse,
  Schwarzer Weg, Sonnleithnergasse, Stallhofstraße) y **garantía pendiente**
  de Pottendorfer: el texto de la API es el mismo. Siguen vigentes.
- **Acceso desde España:** la FAQ (mismo SHA-256) sigue diciendo que puede
  abrir cuenta cualquiera con residencia en el EEE. No consta que cada emisión
  se distribuya en España. Se queda «Sin confirmar».
- **Salida:** sin cambios (vender en el tablón si hay comprador; Cohotel y
  GreenPoint devuelven el nominal el 31/12/2038, subordinado; Pottendorfer,
  primera cancelación a los 15 años).
- **Avisos publicados:** todos vigentes. No se propone ninguno nuevo ni se
  retira ninguno.
- Ninguna ficha se ha quedado sin órdenes de venta: no hay propuesta de
  retirada.

## Registros y advertencias

- **CNMV, EFFECTA GmbH n.º 5003:** libre prestación desde el 11/11/2020, país
  de origen Alemania; solo «Recepción y transmisión de órdenes» sobre valores
  negociables y participaciones de IIC. Agentes: «No se han encontrado datos
  disponibles». El texto es el mismo que ayer (el HTML cambia en cada visita).
- **BaFin:** Effecta GmbH (BaFin-ID 10133261), Wertpapierinstitut con
  Anlagevermittlung y Anlageberatung desde el 26.06.2021; Brickwise Investment
  GmbH, agente vinculado n.º 80174029 de Effecta desde el 04.08.2021, sin fecha
  de baja. Solo cambia «Stand der Daten: 12.11.2026».
- **Advertencias de la CNMV:** sin coincidencias («No hay datos disponibles»)
  para Brickwise, Effecta, Brick Qogir, Brick Sagarmatha, BrickOne, Cohotel,
  Green-Point y Green Point. El buscador funciona: «Trading» da «Página 1 de
  16».

## Decisión

`actualizar` en las 11. Nuevo mínimo en 1 (Pottendorfer), nueva fecha en 10,
«Participaciones en venta» al día en las 4 atrasadas y «Mejor oferta de
compra» nueva en Randhartingergasse. Siguen en «secundario». No se propone
retirar ninguna.

## Bloqueos y límites

- No se sabe si se puede comprar solo una parte de una orden. Ninguna fuente
  pública lo confirma ni lo descarta.
- La API solo enseña órdenes abiertas: no se sabe si la compra de 56 € de
  Randhartingergasse se ejecutó o se retiró.
- El precio publicado no garantiza la compra. Muchas ventas tienen más de un
  año (por ejemplo, 73 de 88 en Stallhofstraße).
- **FMA (Austria): bloqueada hoy.** El navegador sin sesión recibe 403
  «Performing security verification» (Cloudflare) a las 08:34 UTC. No se
  elude. Última lectura válida: 11/11, sin coincidencias.
- Firmenbuch: no consultado (es de pago).
- La portada de brickwise.at (HTML estático) da cifras de «Verfügbare
  Anteile» y «Preis pro Anteil» que no coinciden con la API ni con la app. No
  se usa.

## Archivos

- Expedientes: `../../expedientes/<slug>.json` (11).
- Resumen del libro de órdenes sin direcciones:
  `fuentes/libro-ordenes-resumen-2026-11-13.json`.
- Mercado de la app: `fuentes/web/web-app-marketplace-2026-11-13.txt` y `.png`.
- Textos leídos: `fuentes/web/` y `fuentes/reguladores/` (nombres de personas
  recortados). Crudos, PDF y JS: `fuentes/crudo/` (fuera de Git por el
  `.gitignore` del grupo).
- Inventario: `inventario-consultas.json`.
