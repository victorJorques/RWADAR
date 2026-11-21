# Revisión de contenido · entrega 2026-11-20.2

Revisor independiente de contenido y tarjetas. No monté esta entrega. Revisión
única y directa, como pidió el responsable del proyecto: parto de
`DIFF-ENTREGA.md` y no repito lo que ya prueba el motor (PGlite, repetibilidad,
pruebas). Hora de la revisión: 21/11/2026, 02:10–02:25 UTC.

**Veredicto: aprobada con un cambio, solo en el informe. El SQL no cambia.**

## Qué he comprobado y qué sale

1. **Los 73 cambios son los de la lista cerrada, uno a uno.** Comparo lo leído
   hoy como visitante (`lectura-publica/ofertas-v2.json`) con la
   `documentacion-ofertas.json` nueva, alineando las referencias en orden. Se
   quitan las 68 referencias de la lista y las 2 fuentes (mTBILL
   `main-DOxid0Zj.js`, Spiko Smart Cash GECO `c124199`). No se añade ninguna
   referencia ni fuente. En las referencias que se quedan cambian 18 campos: las
   3 fechas de «Acceso desde España» de Spiko (06/11 → 13/11), el alcance de
   Smart Cash (texto exacto de `auditoria/spiko.md`, hallazgo 3) y **14
   comienzos de alcance que no están en la lista** (ver la corrección O1).
2. **Lo que se quita ya no vale y no se pierde nada necesario.**
   - En las 11 de Brickwise la ficha sigue diciendo que la emisión está cerrada.
     La descripción dice «Hoy solo se compran a otros inversores en el mercado
     de la app». Las referencias del folleto también lo dicen: «Precio de la
     suscripción original, no precio actual ni mínimo de reventa» y «Mínimo de
     la suscripción original (ya cerrada)». Siguen la venta más barata, la orden
     de menor importe, las participaciones en venta y la mejor compra, todas del
     20/11.
   - En Spiko, el registro CNMV n.º 2380 sigue en la métrica «Supervisor». En
     la de dólares sigue «USD (depósito en EUR con conversión)», y en la
     referencia de la moneda, «se puede depositar en euros con conversión».
   - En Aktionariat sigue la métrica «Precio del emisor · 20/11/2026: 7,25 CHF
     por acción (fijo)».
   - En Boss Info siguen «Última operación · 20/11/2026: 8,40 ZCHF (1 acción,
     05/11/2026)» y el precio del emisor (8,50197) en el alcance del mínimo.
   - En Switzerlend sigue «Mínimo de inversión: 1 acción (68,01 CHF el 20/11)».
3. **La tarjeta en la web y en la app.** He pasado `resumenOferta`
   (`rwadar-site/assets/ficha-editorial-20261022.js`) por las 22 ofertas, la
   publicada y la nueva, a las 2026-11-21T02:20Z y a las 2026-11-27T21:00Z.
   Solo cambia una cosa, en las tres de Spiko: `accesoEspana.fechaDato`, de
   2026-11-06 a 2026-11-13. El mínimo, el acceso desde España, la salida, las
   fechas, `cifrasVigentes` y `vencida` son iguales. Ejemplo: Spiko euro
   muestra «1 €» y «Disponible desde España según la fuente». No cambia ningún
   texto de la tarjeta: ni el resumen, ni las métricas, ni los avisos.
4. **Avisos.** Ningún aviso cambia ni se re-fecha. Por oferta, el escaparate
   nuevo es igual al publicado; solo cambian la nota de origen y las rutas del
   lote.

## Fuentes primarias abiertas hoy

| Qué | URL | Hora UTC | Literal | Resultado |
|---|---|---|---|---|
| Nueva fecha de «Acceso desde España» (las 3 de Spiko) | https://docs.spiko.io/documentation/product_overview/fund_availability/ | 02:16:06 | «Country Smart Cash T-Bills Euro T-Bills Dollar T-Bills Pound» · «🇪🇸 Spain ✅ ✅ ✅ ❌» · «Last updated: November 13, 2026» | Bien: fecha del 13/11 y mismo valor |
| Quitar GECO c124199 (Smart Cash) | https://geco.amf-france.org/back-office/funds/compartment/c124199 | 02:16:28 | `{"idInterne":0,…,"published":false}` | Bien: la AMF ya no publica la ficha |
| Quitar `main-DOxid0Zj.js` (mTBILL) | https://midas.app/assets/main-DOxid0Zj.js | 02:15:56 | HTTP 404 «Not found» | Bien |
| Precios de reventa de Brickwise (lo que queda frente a lo que se quita) | https://api.app.brickwise.at/api/v2/assets | 02:15:58 | AT0000A2T4D7: `"stage":"secondary"`, `availableBricks` 0, `availableBricksSecondary` 97, `lowestOfferPrice` 75 · AT0000A324B4: 96 y 81 · AT0000A2RAH5: 335 y 75 | Bien: coincide con la ficha del 20/11 (75,00 € y 97; 81,00 € y 96; 75,00 € y 335). Lo quitado del 01/11 (96, 106, 333 y `sharePrice` 80, 72, 76) ya no vale |

## Corrección obligatoria (no cambia el SQL)

**O1 · El informe dice que no cambia ningún texto, y sí cambia uno.** Fuera de
la lista cerrada, el motor cambia el comienzo del alcance de «Mínimo de
inversión» en 14 fichas: las 11 de Brickwise, Boss Info, Switzerlend y Hausera.
Antes decía «Redacción en castellano del dato comprobado en la fuente el
20/11/2026.» y ahora dice «Comprobado de nuevo en la fuente el 20/11/2026.».
Lo hace `preparar.mjs` (línea 224) con todo dato de tarjeta que se conserva. El
valor, las fechas y el resto de la nota no cambian, y el texto nuevo es cierto
(se comprobó en la fuente el 20/11). Por eso no pido rehacer el SQL. Pero se ve
en la ficha, `DIFF-ENTREGA.md` solo lo enseña en la parte del SQL, y por eso la
sentencia de Hausera cuenta entre las 20.

Cambios exactos en `INFORME-ENTREGA.md`:

- Donde dice «no cambia ningún texto, cifra, aviso, métrica ni dato de tarjeta
  (salvo la fecha de «Acceso desde España» en las tres de Spiko, que no cambia
  de valor).», poner: «no cambia ninguna cifra, aviso, métrica ni dato de
  tarjeta (salvo la fecha de «Acceso desde España» en las tres de Spiko, que no
  cambia de valor). Fuera de la lista solo cambia el comienzo del alcance de
  «Mínimo de inversión» en 14 fichas (las 11 de Brickwise, Boss Info,
  Switzerlend y Hausera): «Redacción en castellano del dato comprobado en la
  fuente el 20/11/2026.» pasa a «Comprobado de nuevo en la fuente el
  20/11/2026.», como pone el motor a todo dato de tarjeta que se conserva; la
  fecha y el resto de la nota no cambian.»
- Donde dice «(las 18 ofertas con cambios y sus revisiones)», poner: «(las 18
  ofertas con cambios, Hausera solo por ese comienzo del alcance, y la
  aprobación)».

## Recomendaciones (para el próximo ciclo, sin tocar esta entrega)

- Switzerlend: quitar «Mínimo de inversión · consulta 01/11/2026: Total: 408.07
  CHF». Es lo que enseñaba el formulario el 01/11 (6 acciones al precio de ese
  día) y ya lo supera «1 acción (68,01 CHF el 20/11)». Es el mismo criterio que
  hoy; su alcance ya aclara que el mínimo es 1 acción, así que hoy no confunde.
- Spiko euro: con la tabla del 23/10 se va también el detalle del alta
  (documento de identidad, biometría, test de conveniencia, posible prueba de
  domicilio). Si se vuelve a comprobar, conviene ponerlo en llano en el alcance
  de «Acceso desde España». La tarjeta ya dice que hace falta el KYC.
- Sonnleithnergasse y Pottendorfer: con la foto «0 de 2.350» y «0 de 1.410» se
  pierde el tamaño de la emisión. Si interesa, se puede poner como dato del
  folleto.
- Aktionariat tiene dos referencias iguales, «Último cruce publicado: 6,25 CHF»
  (ya estaban publicadas): conviene dejar una.
- Smart Cash: en «… la AMF ya no muestra la ficha del fondo: no consta en
  ningún supervisor», conviene decir qué es lo que no consta (que este fondo se
  comercialice en España), para que no se lea como que el fondo no tiene
  supervisor. Es el texto literal de la auditoría y ya estaba publicado, así que
  hoy no frena la entrega.
- Motor (`revisar`): que «Cambios por ficha» enseñe también los cambios del
  comienzo del alcance, para no tener que corregir el informe a mano.
