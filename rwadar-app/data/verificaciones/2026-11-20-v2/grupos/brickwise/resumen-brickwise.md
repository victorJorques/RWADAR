# Brickwise · puesta al día del 20/11/2026

Grupo `brickwise`, 11 fichas de reventa publicadas. Consultas entre las
16:54 y las 17:00 UTC del 20/11/2026, con `curl` y Playwright (solo el
mercado de la app). Sin sesión, sin cuenta y sin formularios.

## En una frase

Las 11 siguen solo en reventa y con vendedores; ninguna ha vuelto a la
emisión primaria ni se ha quedado sin órdenes de venta. Cambia el mínimo de
**dos**: Pottendorfer Straße (80 → **81 €**) y Cohotel (102 → **110 €**). En
las otras nueve el precio de entrada es el mismo y solo cambia la fecha a
(20/11). Varias fichas cambian «mejor compra», «participaciones en venta» u
«orden de menor importe». Lo que leí coincide con el vigía en todas las cifras.

## Orden de venta más barata de cada ficha (API pública, 16:54:47 UTC)

Fuente: `https://api.app.brickwise.at/api/v1/assets` (órdenes abiertas).
Coincide con `lowestOfferPrice` de la v2 (16:54:47 UTC) y con «Preis pro
Anteil ab» del mercado de la app (texto leído a las 16:56:25 UTC). Una
segunda lectura a las 16:59:56 UTC dio exactamente lo mismo en las 11.

| Ficha | Venta más barata (cantidad, fecha de la orden) | Orden de menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Plüddemanngasse | 75,00 € (2, 04/11) | 1 a 99,00 € → 100,49 € | 335 | 20,00 € |
| Sonnleithnergasse | 75,00 € (11, 28/04) | 1 a 80,00 € → 81,20 € | 97 | 65,00 € (**2 en 2 órdenes**) |
| Klagenfurt | 95,00 € (16 en 3 órdenes) | 1 a 95,00 € → 96,43 € | **299** (302) | 15,00 € |
| Stallhofstraße | 68,80 € (1, 08/11) | 1 a 68,80 € → 69,83 € | **315** (317) | 30,00 € |
| Schwarzer Weg | 69,90 € (1, 27/10) | 1 a 69,90 € → 70,95 € | **298** (299) | **62,00 €** (60) |
| Drautalresidenz | 70,00 € (**1, 17/11**) | **1 a 70,00 € → 71,05 €** (84,00) | **147** (150) | **50,00 €** (60) |
| Randhartingergasse | 78,00 € (**20, 29/06**) | **1 a 85,00 € → 86,28 €** (78,00) | **188** (189) | 64,00 € |
| Hinterstoder 50 | 75,00 € (5, 08/11) | **1 a 82,00 € → 83,23 €** (90,00) | **252** (265) | 20,00 € |
| **Pottendorfer** | **81,00 € (1, 15/11)** (80) | **1 a 81,00 € → 82,22 €** (115,00) | **96** (106) | **64,00 €** (19) |
| GreenPoint | 102,00 € (8 en 3 órdenes) | 1 a 102,00 € → 103,53 € | 347 | **29,00 €** (84) |
| **Cohotel** | **110,00 € (35 en 2 órdenes)** (102) | **1 a 120,00 € → 121,80 €** (102,00) | 59 | 3,00 € |

En negrita lo que cambia; entre paréntesis, lo publicado (13/11).

Mínimo de la tarjeta en las 11: «Desde X € la participación en reventa
(20/11)».

## Qué cambia frente a lo publicado

- **Cohotel:** la venta de 1 participación a 102 € ya no está. La más barata
  es ahora 110 € (35 participaciones en dos órdenes antiguas, de 31 y 4). La
  orden de menor importe es 1 a 120 €. Mínimo: «Desde 102 €» → **«Desde
  110 €»**.
- **Pottendorfer:** desaparece la venta de 11 a 80 € y hay una de 1 a 81 €
  (15/11). Mínimo: «Desde 80 €» → **«Desde 81 €»**. La mejor compra sube de
  19 € a 64 € (orden del 17/11). En venta: 106 → 96.
- **Drautalresidenz:** la venta de 3 a 70 € pasa a ser de 1 a 70 € (orden del
  17/11); mismo mínimo. Mejor compra 60 → 50 €.
- **GreenPoint:** desaparece la compra de 84 €; la mejor es ahora 29 €
  (orden del 10/08/2024).
- **Schwarzer Weg:** mejor compra 60 → 62 € (17/11). **Sonnleithnergasse:**
  otra compra a 65 € (ahora 2 en 2 órdenes).
- Participaciones en venta y orden de menor importe al día en el resto (tabla).
- **Plüddemanngasse:** nada cambia; solo la fecha.

## Lo que no cambia (con la consulta de hoy)

- **Documentos:** contrato, KID, Rücktrittsbelehrung y Kosteninformationen:
  mismo SHA-256 que lo publicado según el vigía (16:52 UTC); no se releen y
  van con `segunVigia: true`. Los 11 «Informationsblatt», que el vigía no
  cubre, los descargué hoy: mismo SHA-256.
- **Fichas de la API por emisión:** 6 iguales byte a byte; en 5
  (Schwarzer Weg, Drautalresidenz, Randhartingergasse, Pottendorfer, Cohotel)
  cambian `updatedAt` y cifras de alquiler calculadas, pero los textos de
  alquiler y de garantía que citan los avisos son los mismos.
- **Acceso desde España:** la FAQ tiene el mismo SHA-256 (cuenta para
  residentes del EEE). Se queda «Sin confirmar».
- **Aviso común** (compra parcial no confirmada y 1,5 % del comprador): FAQ
  «Handel» igual y API de comisiones en `"fees":0.015`. Sigue vigente.
- **Salida:** sin cambios. **Avisos publicados:** todos vigentes.
- **Registros:** BaFin (Effecta 10133261 y agente vinculado 80174029, «Stand
  der Daten: 19.11.2026») y CNMV (Effecta n.º 5003, solo RTO, sin agentes):
  igual que el 13/11.
- **Advertencias de la CNMV:** sin coincidencias; re-fechadas con el vigía.

## Decisión

`actualizar` en las 11. Nuevo mínimo en 2 (Pottendorfer y Cohotel), nueva
fecha en 9 y referencias de la ficha al día. Siguen en «secundario». No se
propone retirar ninguna.

## Bloqueos y límites

- **FMA (Austria):** 403 de Cloudflare a las 16:56:54 UTC; no se elude.
  Última lectura válida: 11/11, sin coincidencias.
- No se sabe si se puede comprar solo una parte de una orden.
- La API solo enseña órdenes abiertas: no se sabe si las que desaparecieron
  se ejecutaron o se retiraron.
- Randhartingergasse sigue con `availableBricks=374` con la emisión cerrada
  (anomalía conocida desde el 03/11; no es una reapertura).
- Firmenbuch: no consultado (de pago).

## Archivos

- Expedientes: `../../expedientes/<slug>.json` (11).
- Libro de órdenes sin direcciones: `fuentes/libro-ordenes-resumen-2026-11-20.json`
  y la relectura `fuentes/libro-relectura.json`.
- Mercado de la app: `fuentes/web/web-app-marketplace-2026-11-20.txt` y `.png`.
- Textos: `fuentes/web/` y `fuentes/reguladores/` (nombres recortados). Crudos
  y PDF: `fuentes/crudo/` (fuera de Git).
- Inventario: `inventario-consultas.json`.
