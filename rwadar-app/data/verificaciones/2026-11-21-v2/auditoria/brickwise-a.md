# Auditoría independiente · ámbito «brickwise-a» · 21/11/2026

No investigué ni monté estas fichas. Abrí yo cada fuente entre las 20:13 y las
20:24 UTC del 21/11/2026, sin sesión ni cuenta (curl con su agente por defecto
y Playwright sin trucos). Copias solo en `/tmp/auditoria-2026-11-21/brickwise-a/`,
fuera del repositorio (la API trae carteras de particulares y las ayudas, el
nombre del autor: no se copian aquí).

Fichas: Plüddemanngasse 101 (Graz), Sonnleithnergasse 2 (Viena), local de
estanco de Klagenfurt, Stallhofstraße 28 (Gratwein), Schwarzer Weg 18 (Graz) y
Drautalresidenz (Paternion).

Lo que audito: lo publicado (`2026-11-20.2-v2`) más lo que manda
`DECISIONES-COORDINADOR.md` §2 y §4 para Brickwise (se quedan, aviso del
número fiscal con el literal de la ayuda, acceso desde España como está,
cifras del libro de hoy, Schwarzer Weg 69,90 → 71,90 €), con los textos de
`expedientes/<slug>.json` y la corrección de `revision-independiente/brickwise-a.md`.
La entrega del 21/11 (`decisiones.json`) todavía no existe: no he podido ver
el texto final montado.

## En pocas palabras

- **Las cifras están bien.** El libro de órdenes de hoy (20:13 UTC) tiene los
  mismos bytes que el del vigía y el investigador; recalculé cada cifra y
  coinciden todas, también el cambio de Schwarzer Weg (71,90 €, 297 en venta).
  El mercado de la app, abierto a las 20:19 UTC, enseña los mismos precios.
- **Los documentos están bien.** Bajé los 25 PDF citados: los 25 tienen el
  mismo SHA-256 que los expedientes y el vigía. Las citas (precio de emisión,
  riesgo 6 de 7, sin reembolso ordinario, sin desistimiento en reventa, 1,5 %)
  están tal cual.
- **Hay tres cosas obligatorias que arreglar antes de publicar:**
  1. El aviso nuevo del número fiscal, tal como lo escribe §2 («Brickwise lo
     tramita gratis con su asesor»), no es lo que dice la ayuda y, si sustituye
     al del expediente, **se pierde el aviso de que se tributa en Austria**.
  2. Las fichas siguen con **referencias viejas** (30/09, 22/10, 01/11 y
     05/11) que nadie propone re-fechar ni quitar en este grupo (el grupo
     brickwise-b sí lo hizo para las suyas). Víctor pidió que no quede nada
     viejo.
  3. La referencia «Número fiscal austriaco» dice «vender no lo pide»
     citando una ayuda que dice lo contrario en lo fiscal.

## Qué abrí y qué vi (hora UTC de hoy)

**Libro de órdenes (API pública que usa la web, sin token)**
- `https://api.app.brickwise.at/api/v1/assets` · 200 · 20:13:18 · SHA-256
  `edaee0fe…d207` (igual que el vigía de las 17:36 y el revisor de las 17:59).
- `https://api.app.brickwise.at/api/v2/assets` · 200 · 20:13:19 · `b6d47201…2506` (igual).
- Recalculado con mi propio script (órdenes `open`; importe = cantidad ×
  precio × 1,015, redondeo al céntimo):

| Ficha | Venta más barata | Menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Plüddemanngasse | 75 € × 2 (04/11) | 1 × 99 € → 100,49 € | 335 | 20 € (23/04) |
| Sonnleithnergasse | 75 € × 11 (28/04) | 1 × 80 € → 81,20 € | 97 | 65 €, 2 en 2 órdenes (16/10) |
| Klagenfurt | 95 € × 16 en 3 órdenes | 1 × 95 € → 96,43 € | 299 | 15 € (21/09) |
| Stallhofstraße | 68,80 € × 1 (08/11) | 1 × 68,80 € → 69,83 € | 315 | 30 € (01/07) |
| Schwarzer Weg | 71,90 € × 1 (18/09) | 1 × 71,90 € → 72,98 € | 297 | 62 € (17/11) |
| Drautalresidenz | 70 € × 1 (17/11) | 1 × 70 € → 71,05 € | 147 | 50 € (29/09) |

- Coincide con los expedientes, con `vigia.json` y con `lowestOfferPrice` y
  `availableBricksSecondary` de la v2. Los bloqueos por interesado de las
  órdenes más baratas de Plüddemanngasse y Stallhofstraße ya vencieron (16/11
  y 17/11).
- Comisión: `https://api.app.brickwise.at/api/v1/utils/fees` · 20:16:46 ·
  `{"data":{"fees":0.015}}`.

**Mercado de la app** (`https://app.brickwise.at/desktopWeb/marketplace`,
Playwright sin sesión, texto a las 20:19:15–20:19:31)
- «Preis pro Anteil ab»: Plüddemanngasse € 75,00; Sonnleithnergasse € 75,00;
  Trafik Klagenfurt € 95,00; Stallhofstraße € 68,80; Schwarzer Weg € 71,90;
  Drautalresidenz € 70,00.
- Las seis: «Bestand», «Handel aktiv», «Laufzeit: endlos» y **sin** la
  etiqueta «KESt» (sí la llevan GreenPoint, Cohotel, Pottendorfer y el
  Hinterstoder de renta fija).
- El botón de la ficha («Ver fuente») apunta aquí y responde.

**Ficha de cada emisión** (`https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`, 20:16:42–44)
- Las seis: `securityType "participationRightEquity"`, emisor con
  `countryCode "AUT"`, `isAllowedDomicile []`, `preorderEnabled false`. El
  SHA-256 de Schwarzer Weg (`decb5b04…d569`) es el del expediente.
- Textos de alquiler: Plüddemanngasse «…endet somit am 31.07.2024…»;
  Sonnleithnergasse «…zum 30. September 2023 gekündigt… Derzeit wird ein
  Nachmieter gesucht…» con `contractEndDate` 2026-11-29; Stallhofstraße
  «…endet am 31.03.2027…» con `contractEndDate` 2022-02-01T23:00Z (02/02/2022
  en Austria); Schwarzer Weg «…endet am 30.08.2023…». Los cuatro avisos de
  alquiler se sostienen. Klagenfurt (sin plazo) y Drautal (sin plazo, con
  gestión de vivienda asistida) no llevan aviso, y está bien.

**Ayuda de impuestos** (`https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2`,
200, 20:14:15, `b941508f…82bf`, igual que el investigador y el revisor)
- «Investor:innen, deren Steuersitz nicht in Österreich liegt, und die in ein
  solches Eigenkapital-Produkt österreichischer Emittentinnen investieren
  möchten, können dies durch vorherige Bekanntgabe einer Steuernummer in
  Österreich tun.»
- «Sollte keine österreichische Steuernummer vorhanden sein, so kann diese
  beim österreichischen Finanzamt persönlich oder durch einen Steuerberater
  beantragt werden. Gerne stellt Brickwise auch einen Kontakt zu einem
  Steuerberater her. In diesem Fall entstehen für die Beantragung der
  Steuernummer keine Kosten für die Investor:innen.»
- «Diese Einkünfte sind auch für ausländische Investor:innen in Österreich
  steuerpflichtig.» La declaración conjunta la presenta la emisora y «wird
  zwingend eine österreichische Steuernummer der jeweiligen Investor:innen
  benötigt».
- Al vender: «…unterliegen Gewinne aus der Veräußerung dieser
  Eigenkapital-Produkte in Österreich der Immobilienertragsteuer (ImmoESt).
  Investor:innen müssen diese bis zum 15. des zweitfolgenden Monats in Form
  einer „besonderen Vorauszahlung“ an das österreichische Finanzamt
  entrichten.» y «Für die Einzahlung und Zuordnung der besonderen
  Vorauszahlung wird ebenfalls die persönliche Steuernummer beim Finanzamt in
  Österreich benötigt.»
- El sitemap tiene otra versión (`…/wie-sind-die-ertrage-zu-versteuern`):
  redirige a una página que da 404 (20:23:40). No hay otra ayuda que diga que
  Brickwise tramita el número.

**Código público de la app** (`https://app.brickwise.at/js/app.85dda63a.js`
`b5c9c154…601d` y `…/js/8388.098ec0ae.js` `d0cfc7a3…e02b`, 20:17:13; mismos
bytes que el investigador)
- Ventana: «Bei diesem Produkt wird eine österreichische Steuernummer
  benötigt» · «Die laufenden Erträge dieses Produkts unterliegen der
  Einkommenssteuer in Österreich. Um in dieses Produkt investieren zu können,
  wird eine österreichische Steuernummer benötigt.» · «Steuernummer
  hinzufügen» / «In ein anderes Produkt investieren».
- Condición (función `m`, exportada como `gu`): salta si no es venta, el
  producto es `participationRightEquity` (o su variante de promotor), el
  emisor es `AUT` y la cuenta no tiene número fiscal `AUT`. No mira el país
  del comprador. `initialChecks("buy")` abre la ventana y no deja seguir.
- No pulsé «Kaufen» ni inicié sesión.

**Otras ayudas, Impressum y páginas** (20:14:15–20:16:46)
- «Kann ich einen Account…» (`d652644e…`): «Jede Person mit einem Wohnsitz in
  einem der EWR-Mitgliedstaaten kann einen Account eröffnen.»
- «Wie funktioniert der Handel…» (`52d2e527…`): «…(bestehend aus Preis pro
  Anteil und der Anzahl der angebotenen Wertpapiere)…».
- Impressum (`5ee85c3b…`): agente vinculado de Effecta GmbH, Florstadt; BaFin
  80174029; HRB 269358.
- Las seis `https://www.brickwise.at/assets/<isin>` (fuentes publicadas), la
  `https://www.brickwise.at/marketplace` y el localizador histórico
  `…/mobileWeb/asset/AT0000A2WCE8`: 200.

**Documentos** (25 PDF, 20:15:04–20:15:11): los 25 con el mismo SHA-256 que
los expedientes (y, los que cubre, el vigía).
- Contratos: Ausgabepreis y Mindestzeichnungsbetrag 103,37 / 101,37 / 100,02
  / 100,10 / 100,14 / 100,05 €, «Ordentliche Kündigung: Nein (siehe zu den
  Ausnahmen Punkt 11)», «Tokenisierte Genussscheine», emisores y FN como en la
  ficha. Ojo, sin consecuencia para la ficha: en cuatro contratos la cifra en
  letra no coincide con la de número (Plüddemanngasse «einhundertfünf komma
  dreizehn», Sonnleithnergasse «einhunderteins komma dreizehn»,
  Stallhofstraße y Schwarzer Weg «einhunderteins»); la de número cuadra con el
  importe total de la emisión, así que la ficha usa la buena.
- KID (los seis): «Risikoklasse 6», «Das Produkt läuft endlos/ewig
  ("Perpetual")…», «Die Verwaltung und Übertragung der Token hat
  eigenverantwortlich durch den Anleger zu erfolgen», pérdida total.
- Rücktrittsbelehrung (los seis, «Stand: 10.07.2026»): «2. Kein
  Rücktrittsrecht am Zweitmarkt».
- Kosteninformationen (`3ddf8882…`): «Vermittlungsgebühr 1,50%» para
  comprador y vendedor; notario ~120 € para recuperar la cuenta.

**Registros y advertencias** (20:19:45–20:19:57)
- CNMV, Effecta: «5003 · 11/11/2020», Florstadt, Alemania.
- BaFin, Effecta: «Stand der Daten: 20.11.2026», Wertpapierinstitut,
  Anlageberatung y Anlagevermittlung desde el 26.06.2021.
- BaFin, agentes: Brickwise Investment GmbH, 80174029, Effecta GmbH, desde
  04.08.2021, sin baja.
- CNMV advertencias: Brickwise, Effecta, Brick Qogir, Brick Sagarmatha y
  BrickOne, «No hay datos disponibles.»; la búsqueda de control «Trading» da
  resultados.

## Hallazgos obligatorios

### 1. El aviso nuevo del número fiscal (las seis)

- **Lo que se publicaría** (§2): «Para comprar hace falta un número fiscal
  austriaco. Brickwise lo tramita gratis con su asesor.», en lugar del aviso
  del expediente.
- **Lo que dice la fuente hoy** (20:14:15): Brickwise «stellt… einen Kontakt
  zu einem Steuerberater her» (te pone en contacto con un asesor fiscal) y
  «in diesem Fall entstehen für die Beantragung der Steuernummer keine
  Kosten». Brickwise no lo tramita; lo pide el asesor (o tú, en Hacienda de
  Austria), y lo gratis es solo pedir el número.
- **Y se pierde un riesgo.** Si este aviso sustituye al del expediente, la
  ficha deja de decir que las rentas tributan en Austria y que la ganancia al
  vender paga allí la ImmoESt, con un pago que hace el propio inversor. Nada
  más en la ficha lo dice. Para un particular de España es lo más importante
  del número fiscal.
- **Texto propuesto** (respaldado palabra por palabra y con la corrección del
  revisor):
  «Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de
  Austria y, si lo pides con el asesor fiscal que te presenta Brickwise, no
  cuesta nada. Las rentas tributan en Austria (la emisora presenta una
  declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.»

### 2. Referencias con fecha vieja (las seis)

- Los expedientes de este grupo no traen `referenciasConFechaVieja` ni ningún
  cambio para estas referencias, y el motor no las re-fecha solo (el 20/11
  quedaron con su fecha). Seguirían en la ficha:
  - «Destino de consulta comprobado» (consulta 30/09/2026);
  - «Moneda · 22/10/2026» y «Plazo · 22/10/2026» (Sonnleithnergasse no tiene
    «Plazo»; su «Moneda» cita `www.brickwise.at/marketplace`);
  - las nueve «· consulta 01/11/2026» (Precio, Mínimo de inversión, Qué se
    adquiere, Salida, Riesgos, Comisiones, Acceso desde España, Entidad que
    comercializa, Custodia);
  - «Desistimiento» (consulta 05/11/2026).
- Hoy se pueden re-fechar todas con lo que he abierto:
  - destino: el mercado carga sin sesión y enseña la emisión con «Handel
    aktiv» (20:19);
  - moneda: «Preis pro Anteil ab € …» (20:19);
  - plazo: «Laufzeit: endlos» (20:19) y KID «Das Produkt läuft endlos/ewig
    ("Perpetual")» (20:15, mismo SHA-256);
  - las de 01/11 y el desistimiento: mismos literales en PDF, Impressum y
    ayudas con el mismo SHA-256 (los expedientes ya los tienen en `claims`
    con hora de hoy).
- **Corrección:** re-fechar cada una al 21/11/2026 con esas consultas (en la
  etiqueta, «· 21/11/2026» o «· consulta 21/11/2026») o quitarla; que no
  quede ninguna consulta anterior al 21/11.

### 3. «Número fiscal austriaco: … vender no lo pide» (las seis)

- La referencia cita la ayuda de impuestos, que no dice eso y dice lo
  contrario en lo fiscal: «Für die Einzahlung und Zuordnung der besonderen
  Vorauszahlung wird ebenfalls die persönliche Steuernummer beim Finanzamt in
  Österreich benötigt.» Lo de «vender no lo pide» sale del código de la app
  (la ventana no salta al vender), no de esa fuente.
- **Corrección:** «Obligatorio para comprar esta emisión (producto de capital
  de un emisor austriaco); también hace falta para pagar en Austria la
  ImmoESt si vendes con ganancia.»

## Recomendaciones (claridad)

- **Plüddemanngasse y Sonnleithnergasse, mínimo «Desde 75 € la
  participación».** Los 75 € solo están en un lote (2 y 11 participaciones:
  152,25 € y 837,38 € con el 1,5 %) y no consta que se pueda comprar una
  parte. Una sola cuesta desde 99 € y 80 €. Es el mismo caso que Cohotel en
  §2: si el motor lo admite, «1 participación desde 99 € en reventa (21/11)» y
  «1 participación desde 80 € en reventa (21/11)»; si no, decirlo en el
  alcance del mínimo.
- **«Mínimo de inversión · consulta 01/11/2026» (Mindestzeichnungsbetrag) y
  «Precio · consulta 01/11/2026» (Ausgabepreis).** En la ficha se pintan como
  «Mínimo de inversión» y «Precio», al lado del mínimo de reventa. Mejor
  «Mínimo de la suscripción original (cerrada)» y «Precio de emisión
  original», como hace brickwise-b.
- **Acceso desde España.** Se queda «Sin confirmar…» por decisión, y es
  cierto. Pero no dice lo decisivo: para comprar hace falta el número fiscal.
  Manteniendo el «Sin confirmar» que exige el motor: «Sin confirmar: cuenta
  para residentes del EEE (España incluida), pero comprar exige número fiscal
  austriaco; no consta su venta en España.»
- Al montar: comprobar que la ayuda de impuestos entra en
  `documentacion.fuentes`; si no, la ficha descarta sin avisar cualquier
  referencia que la cite (`referenciasDe` en `ficha-editorial-20261022.js`).

## Sin poder comprobar

- FMA (Austria): `https://www.fma.gv.at/en/?s=brickwise` da 403 con
  `cf-mitigated: challenge` a las 20:22:11. Un solo intento; no se elude.
  Queda la lectura del 11/11.
- Firmenbuch: de pago, no consultado.
- La ventana del número fiscal en pantalla: haría falta iniciar sesión y
  pulsar «Kaufen». Solo la vi en el código público.
- Si se puede comprar parte de una orden: ninguna fuente pública lo dice.
- Si la orden de 69,90 € de Schwarzer Weg se vendió o se retiró: la API solo
  enseña órdenes abiertas.
- El texto final de la entrega del 21/11: aún no está montada.
