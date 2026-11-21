# Revisión independiente · Brickwise (grupo b) · 21/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo cada fuente
entre las **18:02 y las 18:12 UTC** del 21/11/2026, con `curl` y Playwright,
sin sesión, sin cuenta y sin formularios. Copias en
`fuentes/brickwise-b/` (textos) y `fuentes/brickwise-b/crudo/` (crudos, que
llevan direcciones de cartera y un nombre: no van a Git). Inventario en
`fuentes/brickwise-b/inventario-consultas.json`.

## En una frase

**Lo esencial se sostiene.** Randhartingergasse 9 y Hinterstoder 50 piden de
verdad número fiscal austriaco para comprar, también en reventa, así que la
propuesta de retirada se sostiene. Pottendorfer, GreenPoint y Cohotel no lo
piden, y en ellas sigue «sin confirmar» la venta en España. Los precios de hoy
son los que dice el investigador. Hay que corregir dos cosas antes de
publicar (abajo): el mínimo de Cohotel y el aviso nuevo del impuesto KESt.
La tercera, el `.gitignore` del ciclo, ya está resuelta.

**Veredicto global: aprobado con cambios.**

## 1. Número fiscal austriaco (lo que pidió Víctor)

| Comprobación | Fuente y hora (UTC) | Literal o dato |
|---|---|---|
| Ayuda de Brickwise | https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2 · 18:03:58 (mismo SHA-256 que el investigador, `b941508f…`) | «Investor:innen, deren Steuersitz nicht in Österreich liegt, und die in ein solches Eigenkapital-Produkt österreichischer Emittentinnen investieren möchten, können dies durch vorherige Bekanntgabe einer Steuernummer in Österreich tun.» El número se pide «beim österreichischen Finanzamt persönlich oder durch einen Steuerberater». |
| Aviso de la app | https://app.brickwise.at/js/app.85dda63a.js · 18:04:09 (mismo SHA-256, `b5c9c154…`) | «Um in dieses Produkt investieren zu können, wird eine österreichische Steuernummer benötigt.» Botones «Steuernummer hinzufügen» o «In ein anderes Produkt investieren». |
| Regla de la app | mismo archivo, función `m` (exportada como `gu`) | Salta si la operación **no es una venta**, el producto es `participationRightEquity` (o «BuilderOwner»), la sociedad emisora está en `AUT` y la cuenta no tiene número fiscal de Austria. No mira dónde vives. |
| ¿También en reventa? | https://app.brickwise.at/js/8388.098ec0ae.js · 18:04:40 | `handleSecondaryBuy(){this.initialChecks("buy")…}` y en `initialChecks` → `checkUserAbilityToInvestInAustrianEquityAssets` → `openAustrianTaxIdModal()`. **Sí, corta la compra en reventa.** |
| Tipo y país de cada emisión | https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN> · 18:04:46–18:04:48 (mismos SHA-256 que el investigador) | Randhartingergasse (AT0000A2ZT84) y Hinterstoder (AT0000A31KP7): `participationRightEquity`, sociedad en `AUT`. Pottendorfer (AT0000A324B4), GreenPoint (AT0000A38J32) y Cohotel (AT0000A38J40): `participationRightDebtCapital`. Las cinco: `isAllowedDomicile: []`. |
| Etiqueta «KESt» del mercado | https://app.brickwise.at/desktopWeb/marketplace, renderizado 18:09:24 (texto con el mismo SHA-256 que el del investigador, `2e6b144a…`) | «KESt» delante de GreenPoint, Cohotel y Pottendorfer; no delante de Randhartingergasse ni de Hinterstoder. |

**Intento de rebatir la retirada.** (a) ¿Solo en la compra inicial? No: la
compra en reventa pasa por la misma comprobación. (b) ¿Solo para quien vive
fuera de Austria? Ni eso: la regla no mira el domicilio, la pide a cualquiera
sin número austriaco. (c) ¿Otra sociedad emisora? No: las dos están en Viena
(`AUT`). (d) Lo único que matiza la retirada: **no es imposible**. La ayuda
dice que el número se puede pedir con un asesor y que Brickwise pone en
contacto con uno «keine Kosten» para pedirlo. Pero después hay que tributar
en Austria (declaración de la comunidad de inversores y el impuesto ImmoESt al
vender, en un pago a Hacienda de Austria). La fuente sostiene la retirada. El
texto «No, sin número fiscal austriaco…» es correcto porque pone la condición.

## 2. Orden de venta más barata de hoy

API v1 (https://api.app.brickwise.at/api/v1/assets, 18:02:58) y v2 (18:02:59):
**los mismos bytes que el vigía y que el investigador** (`edaee0fe…` y
`b6d47201…`). Lo calculé yo de las órdenes abiertas:

| Ficha | Más barata (cantidad) | 1 sola, la más barata (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Randhartingergasse 9 | 78 € (20, una orden del 29/06/2026) | 85 € → 86,28 € | 188 | 64 € (1) |
| Hinterstoder 50 | 75 € (5, una orden del 08/11/2026) | 82 € → 83,23 € | 252 | 20 € (4 en 2 órdenes; la más antigua del 19/05/2025) |
| Pottendorfer Straße 62 | 81 € (1, 15/11/2026) | 81 € → 82,22 € | 96 | 64 € (1) |
| GreenPoint | 102 € (8: órdenes de 5, 2 y 1) | 102 € → 103,53 € | 347 | 29 € (1) |
| Cohotel | 110 € (35: órdenes de 31 y 4) | 120 € → 121,80 € | 59 | 3 € (1) |

Coincide con el expediente en todo. `lowestOfferPrice` de la v2 y «Preis pro
Anteil ab» del mercado dan lo mismo (78, 75, 81, 102, 110 €). Ninguna orden
más barata tiene hoy un bloqueo activo.

## 3. Cada cambio crítico, ficha a ficha

### randhartingergasse-9-viena · `retirar_propuesta` → **confirmado**
- Retirada: sostenida (punto 1).
- «Mínimo de la suscripción original (cerrada)»: el contrato
  (https://cdn.brickwise.at/5cfbdc1f-e33a-4df8-986c-b3491446f8b7.pdf,
  18:06:37, mismo SHA-256 que el vigía) dice «Mindestzeichnungsbetrag: EUR
  100,24» y «Ausgabezeitraum: 05.08.2022 bis 15.09.2022». La API dice
  `issueEndDate` 2022-09-15 y `stage: secondary`. La app explica que ese
  mínimo es «am Primärmarkt» («Investitionen können ab dem angegebenen Betrag
  am Primärmarkt getätigt werden»). Etiqueta nueva correcta.
- `availableBricks = 374` (bloqueo del investigador): según el código de la
  app, el botón de compra primaria solo sale si la emisión está en fase
  primaria, o en reventa con `onlyPrimary` y plazas libres. Aquí está en
  reventa y `onlyPrimary` es `false`. **Ese 374 no abre ninguna compra
  primaria**: solo hay reventa.
- Aviso del piso vacío: la API (18:04:46) dice «Das Mietverhältnis wurde vom
  Mieter gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht.» y
  la ayuda «Was passiert bei einem Leerstand?» (18:11:55) dice «keine
  Ausschüttungen erfolgen». Se sostiene.
- `resumenTarjeta`: los tres textos tienen 120 caracteres o menos, están en
  castellano llano y tienen respaldo. Solo si la ficha se queda, ver la
  corrección C1 (mínimo en lote).

### apartamento-vacacional-hinterstoder-50 · `retirar_propuesta` → **confirmado**
- Retirada: sostenida (`participationRightEquity`, sociedad en Börseplatz 4,
  Viena, `AUT`; sin etiqueta «KESt»).
- Mínimo original: contrato
  (https://cdn.brickwise.at/8a16682d-6e93-4e0d-9771-894eb18abdf9.pdf,
  18:06:38, SHA-256 igual que el vigía): «Mindestzeichnungsbetrag: EUR 100,20»
  y «Zeichnungsfrist: 25.10.2022 bis 20.12.2022». Cerrada.
- «Plazo: indefinido»: el mercado dice «Laufzeit: endlos». Se sostiene.
- Solo si la ficha se queda, ver C1 (75 € solo en un lote de 5; 1 sola,
  desde 82 €).

### vivienda-pottendorfer-stra-e-62-wr-neustadt · `actualizar` → **confirmado con cambios**
- Sin número fiscal austriaco: es `participationRightDebtCapital` con
  «KESt» (confirmado). La API dice además «Ausschüttungen unterliegen der
  Kapitalertragsteuer iHv 27,5%».
- Mínimo original: contrato
  (https://cdn.brickwise.at/bf300673-e32d-4f8d-9328-9fc5dbda049c.pdf,
  18:06:39, SHA-256 igual): «Mindestzeichnungsbetrag: EUR 100,44»,
  «Zeichnungsfrist: 27.12.2022 bis 27.01.2023», y en la API `issueEndDate`
  2023-03-31. Etiqueta nueva correcta.
- «Sin confirmar» la venta en España: CNMV, Effecta n.º 5003, inscrita el
  11/11/2020 en libre prestación, solo con «Recepción y transmisión de
  órdenes». En la pestaña «Agentes» pone «No se han encontrado datos
  disponibles» (18:09:44–18:09:48). Cuenta para residentes del EEE: «Jede Person
  mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account
  eröffnen.» (18:07:25, mismo SHA-256). Se sostiene.
- Avisos sin cambios, comprobados hoy en la API (18:04:47): «Das
  Mietverhältnis endet am 30.11.2025» y «Grundbücherliche Besicherung noch
  ausstehend».
- `resumenTarjeta`: los tres textos (46, 106 y 117 caracteres) se sostienen.
- Hay que corregir el aviso nuevo del KESt (C2).

### fotovoltaica-greenpoint · `actualizar` → **confirmado con cambios**
- Quitar «Distribuciones esperadas desde 15/02/2024»: la API dice
  `plannedFirstRentalIncomeDate` 2024-02-14T23:00Z y el mercado de hoy
  «Ausschüttungen erw. ab: 14.2.2024». Es una fecha de 2024 presentada como
  «esperada». Quitarla es correcto.
- Mínimo original: contrato
  (https://cdn.brickwise.at/5d912bfb-b159-483c-83cc-3d60352ddc3e.pdf,
  18:06:39, SHA-256 igual): «Mindestzeichnungsbetrag je EUR 100,32» y
  «Zeichnungsfrist: 15.11.2023 bis 15.01.2024». Cerrada.
- Plazo según la KID
  (https://cdn.brickwise.at/f6c7c7ff-f2f1-4272-86dd-39e02432868c.pdf,
  18:06:39, SHA-256 igual): «Beendigungszeitpunkt: 31.12.2038 (15 Jahre)
  ("endfällig")». La app pinta «30.12.2038» porque la API guarda
  2038-12-30T23:00Z. Correcto.
- Subordinación, cláusula 9.2: «erst nach Befriedigung aller anderen
  Gläubiger aus Fremdfinanzierungen» en los casos de 9.2.1 a 9.2.4
  (insolvencia, fondos propios negativos, ratio de recursos propios por
  debajo del 8 % según la URG, liquidación). El aviso nuevo se sostiene. Mejor
  redacción en R2.
- Mínimo de la tarjeta, 102 €: hay una orden de 1 participación a 102 €. Se
  sostiene.
- Hay que corregir el aviso nuevo del KESt (C2).

### fotovoltaica-cohotel · `actualizar` → **confirmado con cambios**
- Lo mismo que GreenPoint, con su contrato
  (https://cdn.brickwise.at/d72ef1c5-5f6e-4d57-9368-8f464356cf35.pdf:
  «Mindestzeichnungsbetrag je EUR 100,85», «Zeichnungsfrist: 15.11.2023. bis
  15.01.2024»), su KID
  (https://cdn.brickwise.at/da8e1df3-d334-4075-9311-299f93c8563e.pdf:
  «Beendigungszeitpunkt: 31.12.2038») y su API
  (`plannedFirstRentalIncomeDate` 2024-02-15T13:00Z; el mercado dice
  «Ausschüttungen erw. ab: 15.2.2024»). Todo se sostiene.
- **Mínimo de la tarjeta**: a 110 € solo hay dos órdenes, de 31 y de 4
  participaciones, y ninguna fuente pública dice que se pueda comprar solo una
  parte. Una sola participación cuesta desde 120 €. «Desde 110 €» no es un
  importe que hoy se pueda pagar con seguridad (C1).
- Hay que corregir el aviso nuevo del KESt (C2).

## 4. Lo re-fechado con el vigía (muestreo)

Las 132 marcas `segunVigia: true` de las cinco fichas apuntan a un documento,
una cifra o una búsqueda que el vigía dio como «no cambia». No hay ninguna
fuera del vigía ni marcada «cambia» o «no se pudo leer».

Para comprobarlo bajé hoy los **16** documentos del vigía de este grupo
(contratos, KID, Kosteninformationen y Rücktrittsbelehrung), entre las
18:06:37 y las 18:06:40. **Los 16 tienen el mismo SHA-256 que en
`vigia.json`** (lista en `fuentes/brickwise-b/pdf-extractos-revisor-2026-11-21.txt`).
Las API v1 y v2 también tienen los mismos bytes.

En las advertencias de la CNMV (Brickwise, Effecta, Cohotel, Green-Point,
Brick Qogir y Brick Sagarmatha, 18:10:31–18:10:41), las seis dicen «No hay
datos disponibles», como el vigía, y la búsqueda de control «Trading» sí da
resultados. El SHA-256 no se puede comparar: la página de hoy trae otro
envoltorio ASP.NET, y dos descargas mías seguidas sí son iguales. Lo que
coincide es el resultado.

Registros: BaFin, Effecta GmbH, BaFin-ID 10133261, «Anlagevermittlung (§ 2
Abs. 2 Nr. 3 WpIG) 26.06.2021» y «Anlageberatung … 26.06.2021» (18:10:05).
Brickwise Investment GmbH figura como agente vinculado n.º 80174029 de
Effecta GmbH, «Tätig ab 04.08.2021», sin fecha de baja, con datos a
20.11.2026 (18:10:21).

## 5. Fichas sin cambios

En este grupo no hay ninguna ficha sin cambios: las cinco cambian. Lo que en
ellas «no cambia» lo comprobé con la fuente de hoy: avisos de alquiler e
hipoteca (Randhartingergasse y Pottendorfer), salida y desistimiento
(Rücktrittsbelehrung de Cohotel, «Stand: 10.07.2026»: «Kein Rücktrittsrecht
… am Zweitmarkt»), comisión del 1,5 % (Kosteninformationen) y riesgo 6 de 7
(KID).

## 6. Datos personales

- Copias del grupo que van a Git (`fuentes/web/`, `fuentes/reguladores/`,
  `libro-ordenes-resumen-2026-11-21.json`, resumen, inventario y los cinco
  expedientes): sin nombres de personas (autores y representantes, «[nombre
  recortado]») y sin direcciones de cartera. Bien.
- `grupos/brickwise-b/fuentes/crudo/` y mi `crudo/` sí llevan direcciones de
  cartera (`api-v1-assets.json`) y el nombre de un representante (BaFin).
  Cuando empecé, la carpeta del ciclo no tenía `.gitignore`. A las 18:14 UTC
  apareció `2026-11-21-v2/.gitignore`, igual que el del 20/11, con
  `grupos/**/crudo/`, `revision-independiente/**/crudo/`, `*.html`, `*.pdf`,
  `*.png` y `vigia-crudo/`. A las 18:16 UTC, `git check-ignore` confirma que
  los dos `crudo/` quedan fuera de Git. Ver C3.

## 7. Correcciones obligatorias

- **C1 · Mínimo de Cohotel** (y de Randhartingergasse y Hinterstoder si se
  quedan): el mínimo de la tarjeta tiene que ser un importe que se pueda pagar
  hoy. Cambiar a «1 participación desde 120 € en reventa (21/11)» (46
  caracteres; es el formato de las Normas). Si las otras dos se quedan:
  «1 participación desde 85 € en reventa (21/11)» y «1 participación desde
  82 € en reventa (21/11)». La venta más barata (110, 78 y 75 €, en lotes) se
  queda como referencia de la ficha, como ya está.
- **C2 · Aviso nuevo del KESt** (Pottendorfer, GreenPoint y Cohotel): «si
  vives en España, declaras aquí los repartos … y en general puedes descontar
  lo retenido según el convenio» no lo dice la fuente. La ayuda lo dice solo
  para «Investor:innen mit Wohnsitz in Deutschland oder Österreich». O se
  quita esa parte, o el aviso queda así, con lo que la ayuda sí dice para todos:
  «El emisor retiene en Austria el impuesto KESt de cada reparto; al vender no
  hay retención y la ganancia la declaras tú.» (119 caracteres; fuente: la
  ayuda, «werden von den Emittentinnen einbehalten» y «erfolgt kein
  automatischer Abzug … in der eigenen Jahressteuererklärung erfasst»).
- **C3 · `.gitignore` del ciclo**: ya está hecho (18:14 UTC; comprobado con
  `git check-ignore` a las 18:16 UTC). Solo queda que no se quite antes del
  commit: los `crudo/` llevan direcciones de cartera y un nombre.

## 8. Recomendaciones (no bloquean)

- R1 · Fichas «KESt»: el acceso «Sin confirmar: cuenta para residentes del EEE
  y sin número fiscal austriaco; …» puede leerse como «no hay acceso sin
  número». Más claro: «Sin confirmar: cuenta para residentes del EEE, no pide
  número fiscal austriaco; no consta su venta en España.» (109).
- R2 · Aviso de subordinación: «baja del 8 % de recursos propios» → «su ratio
  de recursos propios baja del 8 %».
- R3 · Si Randhartingergasse y Hinterstoder se quedan con «España: No»: «…;
  se pide antes a Hacienda de Austria.» (92) en vez de «hay que pedirlo antes
  en Austria», porque se puede pedir con un asesor sin ir allí. El motor del
  20/11 no deja montar un acceso que no empiece por «Sin confirmar» (A21):
  decide el coordinador. La retirada la decide Víctor.
- R4 · Fechas que confunden (punto 3 del encargo): en los mínimos de reventa,
  «(21/11)» es el día en que se vio el precio. Si el coordinador lo unifica
  para todas las de Brickwise, «… en reventa (precio del 21/11)» deja claro
  qué fecha es.

## 9. Bloqueos

- No compruebo el número fiscal con una cuenta (no se inicia sesión): lo leo
  en la ayuda y en el código público de la app, que coinciden.
- Compra de solo una parte de una orden: ninguna fuente pública lo dice (de
  ahí C1).
- FMA y Firmenbuch: no los reabrí. Vale lo del investigador (FMA del 11/11;
  los números FN salen de los contratos).
- La API de Randhartingergasse sigue enseñando una rentabilidad (2,38 %) y el
  mercado «Erw. nächste Ausschüttung: 15.12.2026», aunque el contrato de
  alquiler terminó el 28/02/2026. No se publica rentabilidad, así que no
  afecta a la tarjeta.
