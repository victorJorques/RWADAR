# Auditoría independiente · ámbito «brickwise-a» · 20/11/2026

Auditor independiente (no investigué ni monté nada de este ciclo). Consultas
propias entre las 17:14 y las 17:23 UTC del 20/11/2026, sin sesión ni cuenta,
con `curl` y su agente por defecto y Playwright sin trucos. Copias en
`/tmp/auditoria-2026-11-20/brickwise-a/` (fuera del repositorio; los crudos de
la API llevan carteras de particulares y no se publican).

Fichas: Plüddemanngasse 101 (Graz), Sonnleithnergasse 2 (Viena), local de
estanco de Klagenfurt, Stallhofstraße 28 (Gratwein), Schwarzer Weg 18 (Graz) y
Drautalresidenz (Paternion). Lo que se audita: lo publicado el 13/11 más los
cambios de `DECISIONES-COORDINADOR.md` §2 y §4 con los textos de
`expedientes/<slug>.json`.

## Resumen en llano

- **Las cifras nuevas del día están bien.** Libro de órdenes, mínimo de la
  tarjeta, venta más barata, orden de menor importe, participaciones en venta y
  mejor compra cuadran en las seis fichas con lo que leí yo.
- **Los documentos no han cambiado.** Los 25 PDF citados dan hoy el mismo
  SHA-256 que el expediente. Además los leí: precio de emisión, riesgo 6 de 7,
  sin reembolso ordinario, 1,5 % por operación y sin desistimiento en reventa
  están en el texto.
- **Registros, iguales.** BaFin (Effecta y el agente vinculado n.º 80174029) y
  CNMV (Effecta n.º 5003, sin agentes) dicen lo mismo que el expediente. Las
  cinco búsquedas de advertencias de la CNMV salen sin datos.
- **Lo que hay que arreglar (obligatorio):**
  1. En las seis fichas, el apartado «Datos con su fecha» sigue enseñando
     rentabilidades y repartos previstos viejos («Distribución anual esperada ·
     22/10/2026: 3,76 %», etc.). En cuatro de ellas un aviso de la misma ficha
     dice «la rentabilidad no se muestra». En cinco sale además «Próxima
     distribución esperada · 22/10/2026: 15/11/2026», que ya pasó: la app dice
     hoy 15.12.2026. Las normas no dejan rentabilidad en reventa. Los
     revisores lo avisaron ya cinco veces y no entra en las decisiones de hoy.
  2. En las seis, dos citas «literales» del KID no están en el KID («…erfolgt
     ausschließlich eigenverantwortlich…» y «Genussscheine … läuft endlos»).
- **Recomendado:** precio de emisión de Plüddemanngasse (el KID dice otra
  cifra) y el mínimo de Plüddemanngasse y Sonnleithnergasse, donde a 75 € solo
  se vende en lote.

## Qué abrí y qué vi

**Libro de órdenes (API pública, sin token)**
- `https://api.app.brickwise.at/api/v1/assets` · HTTP 200 · 17:16:24 UTC ·
  SHA-256 `895fcaef…026b`.
- `https://api.app.brickwise.at/api/v2/assets` · HTTP 200 · 17:16:25 UTC ·
  SHA-256 `db1b9ef9…a9b`.
- Son las mismas huellas que las del investigador, del vigía y del revisor.
- Cálculo propio, con aritmética decimal y redondeo «mitad hacia arriba»:

| Ficha | Venta más barata | Menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Plüddemanngasse (AT0000A2RAH5) | 75 € · 2 en 1 orden (04/11) | 1 × 99 € → 100,49 € | 335 | 20 € (23/04) |
| Sonnleithnergasse (AT0000A2T4D7) | 75 € · 11 en 1 orden (28/04) | 1 × 80 € → 81,20 € | 97 | 65 € · 2 en 2 órdenes (16/10 y 16/11) |
| Klagenfurt (AT0000A2U5V3) | 95 € · 16 en 3 órdenes | 1 × 95 € → 96,43 € | 299 | 15 € (21/09) |
| Stallhofstraße (AT0000A2WCD0) | 68,80 € · 1 (08/11) | 1 × 68,80 € → 69,83 € | 315 | 30 € (01/07) |
| Schwarzer Weg (AT0000A2WCE8) | 69,90 € · 1 (27/10) | 1 × 69,90 € → 70,95 € | 298 | 62 € (17/11) |
| Drautalresidenz (AT0000A2YPQ0) | 70 € · 1 (17/11) | 1 × 70 € → 71,05 € | 147 | 50 € (29/09) |

- Todo coincide con `expedientes/` y con `lowestOfferPrice` y
  `availableBricksSecondary` de la v2.
- Ninguna orden más barata tiene hoy un bloqueo activo de interesado: los
  `interestedPartyCooldown` son del 16 y 17/11, ya pasados.
- Las seis están en `stage secondary` con `availableBricks 0`.

**Mercado de la app** (`https://app.brickwise.at/desktopWeb/marketplace`,
Playwright sin sesión)
- HTTP 200; texto tomado a las 17:17:14 UTC.
- SHA-256 del texto `0cdebe01…baa7`, idéntico al del investigador.
- «Preis pro Anteil ab»: € 75,00 / € 75,00 / € 95,00 / € 68,80 / € 69,90 /
  € 70,00. Las seis llevan «Handel aktiv» y «Bestand».
- El botón «Ver fuente» va a esa misma dirección y responde (curl, 200,
  17:19:20 UTC).

**Documentos (25 PDF)**
- Todos dan HTTP 200 entre las 17:17:51 y las 17:17:55 UTC.
- Todos tienen el mismo SHA-256 que el expediente: Investitionsbedingungen,
  KID, Informationsblatt y Rücktrittsbelehrung de las seis, más
  Kosteninformationen.
- Los convertí a texto y comprobé:
  - **«Ausgabepreis»:** 103,37 / 101,37 / 100,02 / 100,10 / 100,14 / 100,05 €.
    Ojo, en cuatro contratos la cifra en letras no coincide con la cifra:
    «einhundertfünf komma dreizehn» junto a 103,37, y «einhunderteins und zehn
    Cent» junto a 100,10. La hoja informativa (Informationsblatt) confirma la
    cifra en número.
  - **«Risikoklasse 6»** y tenencia recomendada de 5 años, en los seis KID.
  - **«Ordentliche Kündigung: Nein»**, en los seis contratos.
  - **«Kein Rücktrittsrecht am Zweitmarkt»** (Stand 10.07.2026), en los seis.
  - **«Vermittlungsgebühr 1,50% … (Käufer:in und Verkäufer:in)»**.
  - API de comisiones `{"fees":0.015}` (17:19:20 UTC).

**Ficha de cada activo (API v1)**
- `https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>` · HTTP 200 ·
  17:18:13–15 UTC.
- Las seis huellas son las mismas que en el expediente.
- Los textos de alquiler de los cuatro avisos están ahí, tal cual:
  - Plüddemanngasse: fin el 31.07.2024.
  - Sonnleithnergasse: rescisión del 30/09/2023 y fin del contrato
    `contractEndDate` el 29/11/2026.
  - Stallhofstraße: 02/02/2022 y 31.03.2027.
  - Schwarzer Weg: 30.08.2023.
- Klagenfurt y Drautalresidenz tienen el alquiler «unbefristet» (sin plazo), sin
  nada que pida un aviso nuevo.

**Web de Brickwise** (curl, 17:19:18–20 UTC, todas HTTP 200)
- **Pregunta «Kann ich einen Account von jedem Land aus eröffnen?»**
  (`d652644e…`, igual que el investigador): «Jede Person mit einem Wohnsitz in
  einem der EWR-Mitgliedstaaten kann einen Account eröffnen.».
- **Pregunta «Wie funktioniert der Handel am Marktplatz?»** (`52d2e527…`,
  igual): «Ist ein dort verfügbares Angebot (bestehend aus Preis pro Anteil und
  der Anzahl der angebotenen Wertpapiere) interessant, kann dieses direkt
  ausgewählt werden.».
- **Impressum:** «vertraglich gebundener Vermittler … unter Haftung der Effecta
  GmbH, Florstadt» y «BaFin Registernummer: 80174029».
- **Avisos de riesgo de la web:** «Bulletin Board» y «Totalverlust».
- **Páginas de los activos** (`/assets/at0000a2…`) y `/marketplace`: responden
  con el título de cada inmueble.

**Registros**
- **BaFin, Effecta** (`institutDetails … institutId=133261`), 17:20:12 UTC:
  - «Wertpapierinstitut», Florstadt;
  - Anlagevermittlung y Anlageberatung (WpIG) desde el 26.06.2021;
  - «Stand der Daten: 19.11.2026».
- **BaFin, agentes vinculados** (búsqueda pública por nombre «Brickwise»),
  17:20:28 UTC:
  - Brickwise Investment GmbH, n.º 80174029, entidad responsable Effecta GmbH;
  - activo desde el 04.08.2021, sin fecha de baja;
  - fecha de alta en el registro 29.06.2023.
- **CNMV, Effecta** (con `accept-language: es`), 17:19:55–58 UTC:
  - la dirección `ESISExtranjerasLP.aspx` del expediente devuelve un 301 hacia
    `/portal/Consultas/ESI/ESISExtranjerasLP`, que responde 200;
  - «Nº Registro Oficial … 5003 11/11/2020», Alemania;
  - «Recepción y transmisión de órdenes … Valores negociables …
    Participaciones y acciones en instituciones de inversión colectiva»;
  - «Agentes: No se han encontrado datos disponibles».
- **CNMV, buscador de advertencias** (Brickwise, Effecta, BrickOne,
  Sagarmatha y Qogir), 17:19:39–48 UTC: «No hay datos disponibles» en las
  cinco.

## Hallazgos

### Obligatorios

**O1 · Rentabilidades y repartos viejos en «Datos con su fecha» (las seis
fichas)**

Siguen publicados, y el motor del 13/11 los conserva («hoy no se añade ni se
quita ninguna»). La web los pinta todos en «Datos con su fecha». Lo que dice la
app hoy, a las 17:17:14 UTC:

| Ficha | Lo que se publicaría | La app hoy |
|---|---|---|
| Plüddemanngasse | «Distribución anual prevista anunciada: 3,58 %»; «Distribución anual esperada · 22/10/2026: 3,76 %»; «Próxima distribución esperada · 22/10/2026: 15/11/2026». Aviso de la misma ficha: «…la rentabilidad no se muestra.» | «4,01 % p.a. Erw. laufende Ausschüttung … Erw. nächste Ausschüttung: 15.12.2026» |
| Sonnleithnergasse | «Distribución anual prevista anunciada: 3,42 %»; «Rentabilidad por alquiler esperada (API de la app) · 22/10/2026: 3,52 %». Aviso: «…la rentabilidad no se muestra.» | «3,42 % p.a. … Ausschüttungen erw. ab: 14.12.2023»; la API da `rentalReturn` 3.72 |
| Klagenfurt | «Distribución anual prevista anunciada: 3,46 %»; «Distribución anual esperada · 22/10/2026: 3,46 %»; «Próxima distribución esperada · 22/10/2026: 15/11/2026»; «Rentabilidad · consulta 01/11/2026: "rentalReturn":3.46; rentalSurplus=11828.12» | «3,46 % p.a. … Erw. nächste Ausschüttung: 15.12.2026»; la API da `rentalReturn` 3.65 |
| Stallhofstraße | «…anunciada: 4,42 %»; «…esperada · 22/10/2026: 4,11 %»; «Próxima… 15/11/2026». Aviso: «…la rentabilidad no se muestra.» | «4,18 % p.a. … 15.12.2026» |
| Schwarzer Weg | «…anunciada: 3,46 %»; «…esperada · 22/10/2026: 3,46 %»; «Próxima… 15/11/2026». Aviso: «…la rentabilidad no se muestra.» | «3,46 % p.a. … 15.12.2026» |
| Drautalresidenz | «…anunciada: 5,96 %»; «…esperada · 22/10/2026: 4,68 %»; «Próxima… 15/11/2026»; «Rentabilidad · consulta 01/11/2026: "rentalReturn":4.83» | «4,68 % p.a. … 15.12.2026»; la API da `rentalReturn` 4.68 |

- **Por qué es obligatorio:**
  - La norma 2 dice que reventa no lleva rentabilidad.
  - El aviso «la rentabilidad no se muestra» es falso mientras esas
    referencias estén en la misma ficha.
  - «Próxima distribución … 15/11/2026» está desfasado: la fuente dice hoy
    15.12.2026.
  - Es la R6 de contenido y la R4 de cumplimiento del 13/11 (quinta vez), y
    `DECISIONES` §2 no lo recoge.
- **Corrección:** quitar de `documentacion.referencias` de las seis fichas
  todas las referencias con etiqueta «Distribución anual prevista anunciada»,
  «Distribución anual esperada · 22/10/2026», «Próxima distribución esperada ·
  22/10/2026», «Rentabilidad por alquiler esperada (API de la app) ·
  22/10/2026» y «Rentabilidad · consulta 01/11/2026».
- **Recomendado en la misma pasada:**
  - quitar también «Precio desde anunciado» (27/09) y «Precio por
    participación · 22/10/2026»;
  - en «Destino de consulta comprobado», corregir «comprobado el30/09/2026» por
    «comprobado el 30/09/2026».

**O2 · Dos citas «literales» del KID que no están en el KID (las seis
fichas)**

La web las pinta como «Cita literal de la fuente, en alemán».

- **«Custodia · consulta 01/11/2026»**
  - Se publica: «Die Verwaltung und Übertragung der Token erfolgt
    ausschließlich eigenverantwortlich durch den Anleger.»
  - Los seis KID dicen: «Die Verwaltung und Übertragung der Token hat
    eigenverantwortlich durch den Anleger zu erfolgen.»
  - «erfolgt ausschließlich» no aparece en ninguno de los 25 PDF.
- **«Qué se adquiere · consulta 01/11/2026»**
  - Empieza por «Genussscheine ... läuft endlos/ewig».
  - Ningún KID contiene la palabra «Genussschein». El KID dice «Das Produkt
    läuft endlos/ewig ("Perpetual") …».
- KID descargados entre las 17:17:51 y las 17:17:54 UTC, con el mismo SHA-256
  que el expediente.
- **Corrección:**
  - valor de «Custodia» → «Die Verwaltung und Übertragung der Token hat
    eigenverantwortlich durch den Anleger zu erfolgen.»;
  - en «Qué se adquiere», cambiar el comienzo por «Das Produkt läuft
    endlos/ewig ("Perpetual") und kann durch den Anleger nur dann gekündigt
    werden, wenn die Token nicht mehr in den Handel auf einem öffentlich
    zugänglichen Marktplatz einbezogen sind.»;
  - lo mismo en el claim `custodia` de los seis expedientes.

### Recomendados

**R1 · Plüddemanngasse, «Precio de emisión original: 103,37 €»**
- El KID de la misma ficha (`f96b7e13…pdf`, SHA-256 igual, 17:17:51 UTC) dice
  «Der Nennbetrag je Token (Produkt) beträgt EUR 107,43 EUR; die Ausgabe
  erfolgt zu 100% des Nennbetrages» (total hasta 107.433,32 €).
- El contrato dice «Ausgabepreis: EUR 103,37 (in Worten: Euro einhundertfünf
  komma dreizehn)» y la hoja informativa, 103,37 €.
- Propuesta de métrica: «103,37 € según el contrato (el KID dice 107,43 €)».

**R2 · Mínimo cuando a ese precio solo se vende en lote**
- **Sonnleithnergasse:** la única orden a 75 € es de 11 participaciones (837,38 €
  con el 1,5 %). La más barata de 1 participación es de 80 € (81,20 €).
  Propuesta: «Desde 75 € la participación en lote de 11; 1 sola, desde 80 €
  (20/11)».
- **Plüddemanngasse:** la única orden a 75 € es de 2 participaciones (152,25 €).
  La de 1 participación más barata es de 99 € (100,49 €). Propuesta: «Desde
  75 € la participación en lote de 2; 1 sola, desde 99 € (20/11)».
- El aviso común lo explica, pero solo en la ficha. Es la R7 de contenido y la
  R3 de cumplimiento del 13/11. API v1, 17:16:24 UTC.

## Sin poder comprobar

- **Compra de solo una parte de una orden:** ninguna fuente pública lo dice; la
  única prueba sería comprar, con cuenta. El aviso «no consta» sigue
  respaldado.
- **Si cada emisión se ofrece a residentes en España:** solo consta el pasaporte
  de Effecta (CNMV n.º 5003) sin agentes. «Sin confirmar» sigue respaldado.
- **FMA austriaca:** no la reabrí. No es un dato visible de la ficha y el
  investigador anotó hoy el 403 de Cloudflare.
- **Firmenbuch:** es de pago. Los números FN los comprobé solo en los contratos
  de emisión.
- **Textos finales que generará el motor:** la entrega del 20/11 aún no está
  montada. Por ejemplo, el alcance del «Mínimo de inversión» de
  Drautalresidenz debe decir «1 participación» (el 13/11 decía 3).
- **Órdenes que han desaparecido desde el 13/11:** la API solo enseña las
  abiertas, así que no se sabe si se ejecutaron o se retiraron.
