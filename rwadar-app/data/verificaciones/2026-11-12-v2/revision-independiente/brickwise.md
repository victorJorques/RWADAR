# Revisión independiente · grupo `brickwise` · 12/11/2026

Revisor independiente (no preparé estos expedientes). Abrí yo mismo las fuentes
primarias entre las **00:40 y las 00:48 UTC** del 12/11/2026, con `curl`, sin
sesión, sin cuenta y sin formularios de alta. Copias en
`fuentes/brickwise/` (textos y resúmenes) y `fuentes/brickwise/crudo/`
(respuestas completas, fuera de Git).

## Veredicto

**Aprobado con cambios.** Las 11 fichas quedan en `actualizar`, como propone el
investigador. Todas las cifras del libro de órdenes coinciden con lo que leí
hoy. Solo hay que corregir **tres importes con comisión que están un céntimo
por debajo** (redondeo) en Klagenfurt, Plüddemanngasse y Pottendorfer.

| Ficha | Mínimo propuesto | Mi lectura (API, 00:40 UTC) | Veredicto |
|---|---|---|---|
| Fotovoltaica Cohotel | 110 → **102 €** | 102 € (1 participación, orden del 11/11) | confirmado |
| Fotovoltaica GreenPoint | 100 → **102 €** | 102 € (8 en órdenes de 5, 2 y 1) | confirmado |
| Pottendorfer Straße 62 | 73 → **80 €** | 80 € (11, orden del 08/02) | confirmado con cambios |
| Hinterstoder 50 | 75 € | 75 € (5, orden del 08/11) | confirmado |
| Drautalresidenz | 70 € | 70 € (3, orden del 18/10) | confirmado |
| Klagenfurt | 95 € | 95 € (5, 10 y 1) | confirmado con cambios |
| Randhartingergasse 9 | 78 € | 78 € (20 y 1) | confirmado |
| Plüddemanngasse 101 | 75 € | 75 € (2, orden del 04/11) | confirmado con cambios |
| Schwarzer Weg 18 | 69,90 € | 69,90 € (1, orden del 27/10) | confirmado |
| Sonnleithnergasse 2 | 75 € | 75 € (11, orden del 28/04) | confirmado |
| Stallhofstraße 28 | 68,80 € | 68,80 € (1, orden del 08/11) | confirmado |

## Correcciones obligatorias

Hoy se añade en la ficha la «Orden de venta de menor importe … con el 1,5 %».
En tres fichas el importe está **redondeado hacia abajo**. Con el redondeo
normal al céntimo (0,005 sube) queda así:

| Ficha | Cálculo | Dice el expediente | Debe decir |
|---|---|---|---|
| Klagenfurt | 95 × 1,015 = 96,425 | 96,42 € | **96,43 €** |
| Plüddemanngasse | 99 × 1,015 = 100,485 | 100,48 € | **100,49 €** |
| Pottendorfer | 115 × 1,015 = 116,725 | 116,72 € | **116,73 €** |

Hay que corregirlo en todos los sitios donde aparece:

- en cada expediente: `referenciasFicha`, `claims`, `prioridadEditorial` y
  `cambiosRespectoPublicado`;
- en `grupos/brickwise/resumen-brickwise.md`;
- en `libro-ordenes-resumen-2026-11-12.json` (`desembolsoMas1_5`);
- en el resumen que se entregó al coordinador (cambio crítico de
  Pottendorfer: «116,72 €»).

Los otros ocho importes están bien: 91,35; 85,26; 103,53 (dos veces); 79,17;
70,95; 81,20 y 69,83 €.

## Lo que comprobé y cómo

### 1. Libro de órdenes (las 11 fichas)

- `https://api.app.brickwise.at/api/v1/assets`, 00:40:32 UTC, HTTP 200,
  236.533 B, SHA-256 `223cb2fd…b56d`. Es **el mismo archivo** que leyó el
  investigador a las 00:32:59: el libro no se movió entre las dos lecturas.
- `https://api.app.brickwise.at/api/v2/assets`, 00:40:33 UTC, SHA-256
  `3504bf67…d3a9`, también idéntico. `lowestOfferPrice` y
  `availableBricksSecondary` coinciden con la v1 en las 11.
- Hay 422 ventas y 95 compras abiertas en todo el tablón. Las 11 fichas están
  en `"stage":"secondary"`.
  - 10 tienen `availableBricks` 0.
  - Randhartingergasse da 374. Es la anomalía conocida, ya anotada en su
    expediente: estaba igual el 11/11 y no es una reapertura.
- Coinciden, ficha por ficha: el precio más barato con su cantidad y fecha,
  las participaciones en venta, la orden de menor importe y la mejor compra
  (tabla en `fuentes/brickwise/libro-ordenes-revisor-2026-11-12.json`).
- Los interesados apuntados también coinciden:
  - la orden de 20 a 78 € en Randhartingergasse;
  - la de 2 a 102 € en GreenPoint.

  Ninguna de las dos tiene un bloqueo activo.

**Contraste con ayer.** Lo comparé con la copia del revisor del 11/11 (09:50 UTC,
`../2026-11-11-v2/revision-independiente/fuentes/reventa/crudo/api-v1-assets-revisor-2.json`).
Solo cambian tres fichas, y exactamente como dice el investigador:

- Pottendorfer: desaparece la venta de 1 a 73 € (creada el 11/11). Quedan 106
  participaciones en venta (ayer 107).
- GreenPoint: desaparece la venta de 5 a 100 € y aparece una de 1 a 102 €
  (11/11). De 351 se pasa a 347.
- Cohotel: desaparece la venta de 7 a 120 € y aparece una de 1 a 102 € (11/11).
  De 65 se pasa a 59.

En la v2 solo cambia una cosa más: en Klagenfurt, `sharePrice` 88 → 90 y
`rentalReturn` 3,73 → 3,65 (`updatedAt` 12/11 00:25 UTC). Eso no se publica.

**Lo que no pude repetir:** la lectura del mercado de la app ya renderizado
(«Preis pro Anteil ab»). Lo intenté dos veces con Chrome sin interfaz, a las
00:43:17 y a las 00:45:01 UTC, y las dos se agotó el tiempo. No cambia nada: la
app toma los datos de esa misma API, y la v2 da el mismo `lowestOfferPrice`.

### 2. Textos de la tarjeta (las 11)

- **Mínimo:** «Desde X € la participación en reventa (12/11)», de 46 a 49
  caracteres.
  - Sigue el formato acordado el 11/11 y no usa «por participación».
  - Está en castellano llano, con fecha y con fuente.
- **Acceso desde España:** igual que lo publicado (116 caracteres).
  - La FAQ, leída a las 00:42:43 UTC con el mismo SHA-256 que ayer
    (`d652644e…`), dice: «Jede Person mit einem Wohnsitz in einem der
    EWR-Mitgliedstaaten kann einen Account eröffnen».
  - «Sin confirmar» sigue siendo lo correcto.
- **Salida:** igual que lo publicado.
  - Cohotel y GreenPoint: 119 caracteres.
  - Pottendorfer: 117.
  - Las otras 8: 81.
- Los tres textos tienen 120 caracteres o menos en las 11 fichas.

### 3. Aviso común propuesto (las 11)

> Cada venta se anuncia con su precio y su número de participaciones; no consta
> que se pueda comprar solo una parte. El comprador paga además un 1,5 % de
> comisión.

**Confirmado.** Lo respaldan tres fuentes:

- **FAQ del mercado**
  - `https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz`,
    00:42:43 UTC, SHA-256 `52d2e527…`, el mismo que el 11/11.
  - Literal: «Ist ein dort verfügbares Angebot (bestehend aus Preis pro Anteil
    und der Anzahl der angebotenen Wertpapiere) interessant, kann dieses direkt
    ausgewählt werden».
- **Kosteninformationen**
  - `https://cdn.brickwise.at/legal/Kosteninformationen_Brickwise.pdf`, 00:42:25
    UTC, SHA-256 `3ddf8882…862b`, el mismo de ayer.
  - Literal: «Vermittlungsgebühr 1,50% … jedem/jeder Investor:in, die an einer
    Transaktion beteiligt ist (Käufer:in und Verkäufer:in), in Rechnung
    gestellt».
- **API de comisiones**
  - `https://api.app.brickwise.at/api/v1/utils/fees`, 00:42:44 UTC.
  - Devuelve `{"data":{"fees":0.015}}`.

**Matiz para el coordinador** (no obliga a cambiar el aviso). Las fuentes apuntan
en direcciones distintas:

- La guía de venta (`51041281…`, la misma que ayer) dice que, al elegir una
  oferta existente, la otra parte ya está de acuerdo «mit dem Preis und der
  Anzahl der Anteile».
- El JS público de la app (`app.85dda63a.js`, SHA-256 `b5c9c154…601d`, el mismo
  que ayer) tiene en la tarjeta de oferta «Max. verfügbar». También tiene
  textos como «Jemand ist bereit, dir die gewünschten Anteile zu verkaufen».
  Eso hace pensar que en la app se elige una cantidad.

Por eso «no consta» es lo justo: el aviso no dice que sea imposible comprar una
parte.

### 4. Documentos

He descargado de nuevo los **46 PDF** (de 00:42:25 a 00:42:37 UTC): los 4 de
cada una de las 11 emisiones, Kosteninformationen y las condiciones de uso.

- Los 46 tienen el mismo SHA-256 que dio el investigador hoy.
- 45 tienen el mismo SHA-256 que los expedientes del 11/11. El que falta, las
  condiciones de uso (`38067d75…6c9c`), no está en esos expedientes, pero es
  el mismo hash que registra ACCESO-FUENTES el 11/11.
- Las 11 fichas de la API por emisión (`bwrealestate…/api/v1/asset/<ISIN>`,
  00:48:14–00:48:18 UTC) tienen el mismo SHA-256 que las del investigador.

Detalle en `fuentes/brickwise/pdf-hashes-revisor-2026-11-12.tsv`.

### 5. Avisos con fecha o dato del día

Muestreo de 3 fichas en la ficha de la API de hoy. Los tres avisos siguen
vigentes:

- **Pottendorfer** (AT0000A324B4):
  - «Das Mietverhältnis endet am 30.11.2025»;
  - «Grundbücherliche Besicherung noch ausstehend.».
- **Randhartingergasse** (AT0000A2ZT84): «Das Mietverhältnis wurde vom Mieter
  gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht».
- **Sonnleithnergasse** (AT0000A2T4D7): «Der aktuelle Mietvertrag wurde zum
  30. September 2023 gekündigt … Derzeit wird ein Nachmieter gesucht».

Las otras fichas tienen el mismo SHA-256 que ayer, así que sus textos tampoco
han cambiado.

### 6. Registros y advertencias

- **CNMV, EFFECTA GmbH, n.º 5003** (00:47:08–00:47:11 UTC; la URL antigua
  `…/Portal/…aspx` redirige con un 301 a `…/portal/…/ESISExtranjerasLP`):
  - «Nº Registro Oficial … 5003 11/11/2020», con país de origen Alemania.
  - Programa: «1. Recepción y transmisión de órdenes … 1) Valores negociables
    3) Participaciones y acciones en instituciones de inversión colectiva».
  - Agentes: «No se han encontrado datos disponibles».
- **BaFin, Effecta** (00:47:23 UTC):
  - «Effecta GmbH Gattung: Wertpapierinstitut … Bafin-ID: 10133261».
  - Anlagevermittlung y Anlageberatung según el WpIG desde el 26.06.2021.
  - «Stand der Daten: 11.11.2026».
- **BaFin, agentes vinculados**, búsqueda pública por «Brickwise» (00:47:35 UTC):
  - «Vertraglich gebundener Vermittler Brickwise Investment GmbH … 80174029
    Effecta GmbH Florstadt 04.08.2021 29.06.2023».
  - Sin fecha de baja.
- **Advertencias de la CNMV**, de 00:46:51 a 00:47:02 UTC: «No hay datos
  disponibles» para Brickwise, Effecta, Cohotel, Green Point, Brick Qogir,
  BrickOne y Brick Sagarmatha. El buscador funciona: «Trading» da «Página 1 de
  16».
- **FMA:** no se repitió hoy, ni por el investigador ni por mí. El encargo de
  hoy pide la CNMV, y `curl` recibe un 403 de Cloudflare. Sigue valiendo la
  lectura del 11/11, y así lo dicen los expedientes.

### 7. Datos personales en las copias del grupo

**Sin nombres de personas físicas** en lo que va a Git:

- los 11 expedientes;
- `resumen-brickwise.md`, `inventario-consultas.json` y
  `libro-ordenes-resumen-2026-11-12.json`;
- `fuentes/web/` y `fuentes/reguladores/`.

En esas copias el nombre del gerente y el del representante en BaFin aparecen
recortados. Tampoco hay direcciones de cartera.

Los crudos sí llevan nombres y direcciones: el HTML de la web, el JS, dos
hojas informativas en PDF y el HTML del registro de agentes de BaFin. Están en
`grupos/brickwise/fuentes/crudo/`.

**Ojo antes de pasar el día a Git.** Hoy `2026-11-12-v2/` está excluido entero
por `.git/info/exclude`, y la carpeta no tiene su propio `.gitignore`. Antes de
añadirla hay que poner uno como el del 11/11, con `grupos/**/crudo/`,
`revision-independiente/**/crudo/`, `*.pdf` y `*.html`. Si no, entrarían en Git
nombres y direcciones de cartera.

En mi copia cruda del registro de BaFin he recortado el nombre del
representante.

## Bloqueos que siguen (iguales que los del investigador)

- No se sabe si se puede comprar solo una parte de una orden (ver el matiz del §3).
- La API solo enseña órdenes abiertas: no se sabe si las ventas de 73 € (Pottendorfer),
  5 a 100 € (GreenPoint) y 7 a 120 € (Cohotel) se vendieron o se retiraron.
- FMA no repetida hoy; Firmenbuch no consultado (de pago); `sharePrice` sin metodología.
- No pude repetir la lectura renderizada del mercado de la app (ver §1).

## Recomendaciones (no obligatorias)

- **El precio más barato a veces solo se vende por lotes.** Pasa en 5 fichas:

  | Ficha | Lote al precio más barato |
  |---|---|
  | Pottendorfer | 11 a 80 € |
  | Sonnleithnergasse | 11 a 75 € |
  | Hinterstoder | 5 a 75 € |
  | Drautal | 3 a 70 € |
  | Plüddemanngasse | 2 a 75 € |

  La tarjeta de la lista enseña el mínimo sin el aviso común. Quien lea
  «Desde 80 € la participación» en Pottendorfer puede pensar que entra con unos
  81 €. Pero, si no se puede comprar solo una parte, la entrada más pequeña hoy
  es de 116,73 €, y la de 80 € exige 893,20 €.

  El formato está acordado y el aviso común lo cubre en la ficha. Aun así, el
  coordinador puede valorar algo como «Desde 80 € la participación en
  reventa, en lote de 11 (12/11)», que tiene 61 caracteres.
- En los bloqueos de los expedientes, decir que hay **indicios en las dos
  direcciones**, como ya hace ACCESO-FUENTES §2.4. Ahora dicen que ninguna
  fuente lo confirma ni lo descarta.

## Copias de este revisor

En `fuentes/brickwise/`:

- `inventario-revisor.json`: 78 consultas con hora, HTTP y SHA-256;
- `libro-ordenes-revisor-2026-11-12.json`: sin direcciones, con el contraste
  con ayer;
- `pdf-hashes-revisor-2026-11-12.tsv`;
- `kosten-fees-js-revisor-2026-11-12.txt`;
- `web-faq-handel-…`, `web-faq-land-…` y `web-guia-verkaufen-revisor-2026-11-12.txt`;
- `cnmv-effecta-5003-…`, `cnmv-advertencias-…` y `bafin-revisor-2026-11-12.txt`.

Los crudos están en `crudo/`, fuera de Git según la convención del 11/11.
