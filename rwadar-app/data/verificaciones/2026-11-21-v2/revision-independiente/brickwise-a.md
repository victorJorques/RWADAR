# Revisión independiente · grupo brickwise-a · 21/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo cada fuente
entre las 17:59 y las 18:13 UTC del 21/11/2026, sin sesión ni cuenta (curl y
Playwright). Copias en `fuentes/brickwise-a/`; los crudos (API con carteras,
HTML con nombres, PDF y JS) están en `fuentes/brickwise-a/crudo/`, fuera de Git.
Huellas en `fuentes/brickwise-a/inventario-revisor.json`.

Fichas: Plüddemanngasse 101 (Graz), Sonnleithnergasse 2 (Viena), local de
estanco de Klagenfurt, Stallhofstraße 28 (Gratwein), Schwarzer Weg 18 (Graz) y
Drautalresidenz (Paternion). Las seis llevan `retirar_propuesta`.

## Veredicto: aprobado con cambios

**La fuente sostiene las seis retiradas.** Hoy un particular que vive en España
y no tiene número fiscal austriaco no puede terminar la compra de ninguna de
las seis en la app. Lo dicen la ayuda de Brickwise y el código público de la
app, y lo he comprobado yo.

- **Schwarzer Weg:** el cambio de cifra se confirma. La venta más barata es
  71,90 € (antes, 69,90 €) y hay 297 participaciones en venta (antes, 298).
- **Las otras cinco:** sus cifras no cambian. Las he comprobado una a una.
- **Documentos y registros:** también iguales.

Hay **una corrección obligatoria**, que no toca ningún texto de la tarjeta: al
presentar la retirada a Víctor hay que decir que el número fiscal se puede
pedir sin coste a través de Brickwise. Es decir, la retirada es una decisión
editorial, no una prohibición por país. Detalle al final.

## Qué abrí yo y qué vi

**Libro de órdenes (API pública)**
- `https://api.app.brickwise.at/api/v1/assets`: HTTP 200, 17:59:24 UTC,
  SHA-256 `edaee0fe…d207`.
- `https://api.app.brickwise.at/api/v2/assets`: HTTP 200, 17:59:25 UTC,
  SHA-256 `b6d47201…2506`.
- Son los mismos bytes que leyeron el investigador (17:42) y el vigía (17:36).
  La API no ha cambiado desde entonces.
- Calculé las cifras yo mismo desde las órdenes abiertas, con mi propio script
  (resultado en `fuentes/brickwise-a/libro-revisor-2026-11-21.json`, sin
  direcciones de cartera):

| Ficha | Venta más barata | Orden de menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Plüddemanngasse (AT0000A2RAH5) | 75 € × 2, una orden del 04/11 | 1 × 99 € → 100,49 € | 335 | 20 € (23/04) |
| Sonnleithnergasse (AT0000A2T4D7) | 75 € × 11, una orden del 28/04 | 1 × 80 € → 81,20 € | 97 | 65 €, 2 en 2 órdenes (16/10) |
| Klagenfurt (AT0000A2U5V3) | 95 € × 16, en órdenes de 5, 10 y 1 | 1 × 95 € → 96,43 € | 299 | 15 € (21/09) |
| Stallhofstraße (AT0000A2WCD0) | 68,80 € × 1 (08/11) | 1 × 68,80 € → 69,83 € | 315 | 30 € (01/07) |
| **Schwarzer Weg (AT0000A2WCE8)** | **71,90 € × 1 (18/09)** | **1 × 71,90 € → 72,98 €** | **297** | 62 € (17/11) |
| Drautalresidenz (AT0000A2YPQ0) | 70 € × 1 (17/11) | 1 × 70 € → 71,05 € | 147 | 50 € (29/09) |

- Coincide cifra por cifra con los seis expedientes y con `vigia.json`.
- El `lowestOfferPrice` y el `availableBricksSecondary` de la v2 también
  coinciden: 75, 75, 95, 68,8, 71,9 y 70; 335, 97, 299, 315, 297 y 147.
- Ninguna de las órdenes más baratas tiene un bloqueo activo por interesado.
- La orden de 69,90 € de Schwarzer Weg ya no está en el libro.

**Mercado de la app** (`https://app.brickwise.at/desktopWeb/marketplace`)
- Abierto con Playwright y sin sesión; texto a las 18:02:24 UTC
  (`web-app-marketplace-revisor-2026-11-21.txt` y `.png`).
- «Preis pro Anteil ab» da: Plüddemanngasse € 75,00; Sonnleithnergasse
  € 75,00; Trafik Klagenfurt € 95,00; Stallhofstraße € 68,80; **Schwarzer Weg
  € 71,90**; Drautalresidenz € 70,00.
- Las seis llevan «Handel aktiv» y «Bestand», y **ninguna lleva la etiqueta
  «KESt»**.
- Sí la llevan GreenPoint, Cohotel, Pottendorfer y el Hinterstoder de renta
  fija. Randhartingergasse 9 y el apartamento Hinterstoder 50 tampoco la llevan.

**Fichas de la app** (`https://app.brickwise.at/desktopWeb/asset/<ISIN>/details`)
- Abiertas entre las 18:02:57 y las 18:12:57 UTC. La de Stallhofstraße agotó el
  tiempo la primera vez; la reintenté y abrió.
- Las seis enseñan «Kaufen» y «Fremdkapitalanteil: Nein», es decir, no son de
  deuda.

**Ficha de cada emisión en la API**
(`https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`, 17:59:25–27 UTC,
mismos SHA-256 que el investigador)
- Las seis dicen `securityType: participationRightEquity` y
  `spv.address.countryCode: AUT`.
- Las seis tienen `isAllowedDomicile: []`: no hay lista de países, así que el
  domicilio no bloquea a nadie.
- Las seis tienen `type: realEstate` y `preorderEnabled: false`.
- Emisores:
  - BrickOne GmbH & Co KG (FN 538538 v): Plüddemanngasse;
  - Brick Sagarmatha GmbH & Co KG (FN 549469 v): Sonnleithnergasse y Drautal;
  - Brick Qogir GmbH & Co KG (FN 549470 w): Klagenfurt, Stallhofstraße y
    Schwarzer Weg.

**Ayuda de Brickwise sobre impuestos**
(`https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2`,
HTTP 200, 17:59:27 UTC, SHA-256 `b941508f…282bf`, igual que el investigador)
- Apartado «Eigenkapital-Produkte», literal: «Investor:innen, deren Steuersitz
  nicht in Österreich liegt, und die in ein solches Eigenkapital-Produkt
  österreichischer Emittentinnen investieren möchten, können dies durch
  vorherige Bekanntgabe einer Steuernummer in Österreich tun.»
- Sigue así: «…kann diese beim österreichischen Finanzamt persönlich oder
  durch einen Steuerberater beantragt werden. Gerne stellt Brickwise auch
  einen Kontakt zu einem Steuerberater her. **In diesem Fall entstehen für die
  Beantragung der Steuernummer keine Kosten für die Investor:innen.**»
  (si se pide a través del asesor que ofrece Brickwise, no cuesta nada).
- Las rentas son de alquiler y tributan en Austria. La declaración conjunta la
  presenta la emisora, y para ello «wird zwingend eine österreichische
  Steuernummer der jeweiligen Investor:innen benötigt».
- Al vender con ganancia se paga en Austria la ImmoESt, en forma de pago
  anticipado especial.
- Los productos de deuda llevan la etiqueta «KESt».
- Copia sin el nombre del autor: `web-faq-steuern-revisor-2026-11-21.txt`.

**Código público de la app**
(`https://app.brickwise.at/js/app.85dda63a.js` y `…/js/8388.098ec0ae.js`,
HTTP 200, 18:00:52 UTC; SHA-256 `b5c9c154…601d` y `d0cfc7a3…e02b`, iguales a
los del investigador)
- **Los textos de la ventana.** «Bei diesem Produkt wird eine österreichische
  Steuernummer benötigt» · «Um in dieses Produkt investieren zu können, wird
  eine österreichische Steuernummer benötigt.» · botones «Steuernummer
  hinzufügen» e «In ein anderes Produkt investieren».
- **La condición.** La función `gu` del módulo 92169 devuelve «hace falta la
  ventana» cuando se cumplen las tres cosas: no se trata de vender, el producto
  es `participationRightEquity` (o su variante «BuilderOwner») y el emisor está
  en `AUT`. Solo deja pasar a la cuenta que tiene un número fiscal de
  `country: AUT`. **No mira dónde vive el comprador**: cualquiera sin número
  austriaco ve la ventana.
- **El botón que usan estas seis.** Intenté rebatirlo con el botón: el botón
  que se elige para estas seis (`partnerId` brickwise, `type` realEstate, sin
  reserva previa) es `DefaultTradeButton`. Su `initialChecks("buy")` abre esa
  ventana y no devuelve `true`, así que `handleSecondaryBuy` no navega a la
  compra. Vender (`"sell"`) no lo pide.
- Comprobé también que el valor `participationRightEquity` del código es
  literalmente esa cadena (en `chunk-vendors.992cdb3e.js`, 18:01:58 UTC).
- No pulsé «Kaufen» ni inicié sesión.

**Documentos**
- Descargué de nuevo, entre las 18:06:47 y las 18:06:52 UTC, los 30 PDF que
  citan los seis expedientes: KID, contrato, Informationsblatt,
  Kosteninformationen y Rücktrittsbelehrung de cada uno. **Los 30 tienen el
  mismo SHA-256** que los expedientes.
- En los seis KID están, tal cual, las citas que el investigador corrigió:
  - «Das Produkt läuft endlos/ewig ("Perpetual")…»;
  - «Die Verwaltung und Übertragung der Token hat eigenverantwortlich durch den
    Anleger zu erfolgen.»;
  - «…in die Risikoklasse 6 eingestuft».
- Las citas antiguas («Genussscheine…», «…erfolgt ausschließlich
  eigenverantwortlich…») no aparecen en ninguno.
- En Schwarzer Weg comprobé además:
  - contrato: «Ausgabepreis: EUR 100,14», «Mindestzeichnungsbetrag: EUR
    100,14» y «Ordentliche Kündigung: Nein»;
  - Informationsblatt: «Von der Emittentin abgeführt wird: Kapitalertragsteuer»
    (la contradicción con la ayuda de hoy que anota el investigador es real);
  - Rücktrittsbelehrung «Stand: 10.07.2026»: «Kein Rücktrittsrecht am
    Zweitmarkt»;
  - Kosteninformationen: «Vermittlungsgebühr 1,50%… Käufer:in und
    Verkäufer:in».

**Otras ayudas e Impressum** (17:59:27–28 UTC, mismos SHA-256 que el 20/11)
- «Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen
  Account eröffnen.»
- «…Angebot (bestehend aus Preis pro Anteil und der Anzahl der angebotenen
  Wertpapiere)…»
- Impressum: Brickwise Investment GmbH, HRB 269358, agente vinculado de
  Effecta GmbH.

**Registros**
- **CNMV, Effecta** (`https://www.cnmv.es/portal/Consultas/ESI/ESISExtranjerasLP?numero=5003&tipo=CLP`,
  18:07:30–33 UTC):
  - «EFFECTA GmbH · 5003 · 11/11/2020», Florstadt, Alemania;
  - programa: «Recepción y transmisión de órdenes… 1) Valores negociables, 3)
    Participaciones y acciones en instituciones de inversión colectiva»;
  - agentes: «No se han encontrado datos disponibles».
- **BaFin, Effecta** (`…institutDetails.do?…institutId=133261`, 18:07:35 UTC):
  - «Stand der Daten: 20.11.2026»; Wertpapierinstitut, Bafin-ID 10133261;
  - Anlagevermittlung y Anlageberatung según la WpIG desde el 26.06.2021.
- **BaFin, agentes vinculados** (`…vermittlerSucheForm.do?nameVermittler=Brickwise…`,
  18:07:36 UTC):
  - Brickwise Investment GmbH, n.º 80174029, Effecta GmbH;
  - «Tätig ab 04.08.2021», sin «Tätig bis», Meldedatum 29.06.2023.
- Todo coincide con los expedientes.

**Advertencias de la CNMV**
(`https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`, 18:08:00–10 UTC)
- Brickwise, Effecta, Brick Qogir, Brick Sagarmatha y BrickOne dan «No hay
  datos disponibles».
- La búsqueda de control «Trading» sí da resultados, así que el buscador
  funciona.
- La huella del HTML cambia en cada petición, pero el resultado es el mismo que
  el del vigía.

**FMA (Austria)**
- `https://www.fma.gv.at/en/?s=brickwise`: 403 «Just a moment...» (Cloudflare)
  a las 18:09:36 UTC.
- Un solo intento; no se elude. Confirma el bloqueo del investigador.

## Intento de rebatir la retirada

1. **¿Puede comprar sin el número un particular de España?** No. La condición
   del código no depende del país del comprador, solo de tener un número fiscal
   austriaco. La ayuda lo dice igual para quien no tributa en Austria.
2. **¿Hay otro camino de compra?** El botón por defecto es el que usan estas
   seis. Los botones especiales (Oekostrom, modelo de promotor, plantas
   solares) no les tocan.
3. **¿Es una exclusión definitiva?** No. La ayuda dice que el número se puede
   pedir a Hacienda de Austria, en persona o con un asesor, y que con el asesor
   que ofrece Brickwise no cuesta nada. Por eso «España: No» es cierto para
   quien no lo tiene, pero la retirada es una decisión editorial: un trámite
   extra en Austria y tributar allí. No es una prohibición. Víctor debe verlo
   así (corrección 1).
4. **¿Son de verdad productos de capital?** Sí, por tres vías: la API
   (`participationRightEquity`), la ficha de la app («Fremdkapitalanteil:
   Nein») y la falta de la etiqueta «KESt» en el mercado.

## Cada ficha

| Ficha | Cambios críticos | Veredicto |
|---|---|---|
| Plüddemanngasse 101 | España «Sin confirmar» → «No…»; `disponibleEs` → excluido; aviso de la cuenta EEE; aviso nuevo del número fiscal | Confirmado con un cambio (corrección 1) |
| Sonnleithnergasse 2 | Los mismos | Confirmado con un cambio (corrección 1) |
| Local de estanco Klagenfurt | Los mismos | Confirmado con un cambio (corrección 1) |
| Stallhofstraße 28 | Los mismos | Confirmado con un cambio (corrección 1) |
| **Schwarzer Weg 18** | Los mismos, más el mínimo 69,90 → 71,90 €, la venta más barata (orden del 18/09), la orden de menor importe (72,98 €) y 298 → 297 en venta | Confirmado con un cambio (corrección 1). Las cifras nuevas están confirmadas en la API y en el mercado de la app |
| Drautalresidenz | Los mismos | Confirmado con un cambio (corrección 1) |

Textos de la tarjeta (punto 4) de las seis:
- **«España»:** «No: la app no deja comprar esta emisión sin número fiscal
  austriaco (se pide a Hacienda de Austria).» Tiene 100 caracteres. Está en
  castellano llano, lo respaldan la ayuda y el código, y no hay cita en alemán.
- **«Mínimo»:**
  - «Desde 71,90 € la participación en reventa (21/11)» (Schwarzer Weg);
  - los otros cinco, con su cifra de siempre y «(21/11)».
  - Cumplen el formato que exige el motor, no dicen «por participación» y la
    fecha es la del precio, no la de una oferta.
  - El corto («Desde 71,90 € la participación (21/11)») tiene 38 caracteres.
- **«Salida»:** sin cambios. «Ordentliche Kündigung: Nein» en el contrato y
  1,5 % en Kosteninformationen.
- **Avisos:** el aviso nuevo del número fiscal es, palabra por palabra, el que
  ya publican Randhartingergasse 9 y Hinterstoder 50.
- **Alquiler:** los avisos de alquiler siguen respaldados por el texto de la
  API de hoy.

## Lo re-fechado con el vigía (muestreo)

- **El cotejo.** Con un script repasé los 42 datos marcados `segunVigia` de las
  seis fichas: los dos documentos de cada una, sus dos citas y las tres
  búsquedas de la CNMV. Los 42 están en `vigia.json` como «no cambia», con la
  misma hora y, en los documentos, el mismo SHA-256. Ninguno está como
  «cambia» o «no se pudo leer», y ninguno falta.
- **Lo que reabrí.** No me quedé en el muestreo: reabrí todo.
  - Las 6 Rücktrittsbelehrung y Kosteninformationen: mismo SHA-256 que el
    vigía.
  - Las 5 búsquedas de la CNMV: mismo resultado.

## Datos personales (punto 6)

- **Copias del grupo.** Las que están fuera de `crudo/` no tienen nombres de
  personas: el autor de las ayudas y el representante de la BaFin salen como
  «[nombre recortado]».
- **Carteras.** El resumen del libro de órdenes no lleva direcciones de
  cartera.
- **`crudo/` del grupo.** Está fuera de Git por su propio `.gitignore`.
- **Mis copias.** Las de `fuentes/brickwise-a/` van recortadas igual. Mis
  crudos (que sí tienen el nombre del autor y del representante, y las
  carteras) están en `fuentes/brickwise-a/crudo/`, fuera de Git por un
  `.gitignore` en esa carpeta.

## Bloqueos

- **FMA:** 403 de Cloudflare; no se elude. Queda la última lectura válida, del
  11/11, sin coincidencias.
- **Firmenbuch:** no consultado (es de pago).
- **La ventana del número fiscal:** vista en el código, no en pantalla.
  Haría falta iniciar sesión y pulsar «Kaufen», y no se hace.
- **Compra parcial de una orden:** sin confirmar en ninguna fuente pública.

## Correcciones obligatorias

1. **En el motivo de la retirada y en lo que se presente a Víctor** (las seis
   fichas). No cambia ningún texto de la tarjeta. Hay que añadir que la ayuda
   de Brickwise permite pedir el número fiscal austriaco con un asesor que
   Brickwise ofrece, sin coste para el inversor (literal: «In diesem Fall
   entstehen für die Beantragung der Steuernummer keine Kosten für die
   Investor:innen»). Así queda claro que la retirada es editorial: un trámite
   en Austria y tributar allí, no una prohibición.
   - Hay que precisar también el «después declarar allí las rentas». La
     declaración conjunta de las rentas la presenta la emisora con el número
     fiscal de cada inversor. Lo que paga y declara el propio inversor en
     Austria es la ImmoESt cuando vende con ganancia.

## Observaciones (no obligatorias)

- **Schwarzer Weg, la orden de 69,90 €:** probablemente se vendió, no se
  retiró.
  - El `sharePrice` de la v2 pasa de 70 (20/11) a 69,9 hoy, con `updatedAt`
    2026-11-21T07:16:58Z.
  - La app enseña «Marktkapitalisierung € 206.904,00», que es 2.960 × 69,90 €.
  - La ayuda «Wie berechnet sich der Marktwert?» (18:12:25 UTC) dice que se
    calcula con el «zuletzt gehandelten Preis».
  - Esto rebaja el bloqueo «no se sabe si se vendió o se retiró» a «indicio de
    venta». No cambia ninguna cifra de la ficha.
- **Plüddemanngasse y Sonnleithnergasse:** si se mantienen, el mínimo «Desde
  75 € la participación» puede confundir.
  - Esos 75 € solo se venden en lote (de 2 y de 11), y no consta que se pueda
    comprar una parte.
  - La participación suelta más barata cuesta 99 € y 80 €. La ficha ya lo
    dice en «Orden de venta de menor importe».
  - Ya se publicó así el 20/11 y el formato lo fija el motor. Lo decide el
    coordinador.
- **Primer paso de las seis:** pasa de «Cuenta con residencia EEE» a «Número
  fiscal austriaco», y ese cambio no está en `cambiosRespectoPublicado`. Los
  pasos no se publican en el catálogo, así que no afecta a lo que ve el
  cliente.
- **Stallhofstraße:** su `sharePrice` también se movió (69,96 → 70, el 20/11 a
  las 18:51 UTC). No afecta a ninguna cifra de la ficha.
