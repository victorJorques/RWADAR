# Revisión independiente · grupo Brickwise · 10/11/2026

Revisor independiente; no preparé estos expedientes. Entre las **09:20 y las
09:26 UTC** abrí yo mismo, sin iniciar sesión, todas las fuentes que sostienen
los 12 expedientes del grupo. Revisé:

- las API de Brickwise (v1, v2, por ISIN, comisiones y launchpad);
- el mercado de la app y la ficha de BILLA, con Playwright;
- la portada y la FAQ;
- los 55 PDF;
- la BaFin, la CNMV y la FMA.

Copias, hora, código HTTP y SHA-256 de cada consulta:
[`fuentes/brickwise/inventario-consultas.json`](fuentes/brickwise/inventario-consultas.json).
Las respuestas crudas de la API (con carteras y tokenId) y los HTML que llevan
nombres de personas están en `fuentes/brickwise/crudo/`, fuera de Git. En mis
copias de texto los nombres están recortados.

**Veredicto global: aprobado con cambios.** Las 11 tarjetas de reventa se
sostienen tal como las propone el investigador, cifra a cifra, y el
`no_admitir` de BILLA también. La corrección obligatoria **no toca ninguna
tarjeta**: dos copias del grupo, fuera de `crudo/`, llevan nombres de personas
físicas (punto 4).

## 1. Lo común a Brickwise

| Comprobación | Fuente y hora (UTC) | Literal | Resultado |
|---|---|---|---|
| El libro de órdenes no cambió | https://api.app.brickwise.at/api/v1/assets y `/api/v2/assets`, 09:20:39–40 | — | **Confirmado.** Mis dos respuestas tienen el mismo SHA-256 que las del investigador de las 09:01–09:02 y que su control de las 09:17 (`42be450f…` en v1, `5360bc26…` en v2). Esta vez el control sí fue a la v1, que es la que trae las órdenes. |
| Mercado de la app | https://app.brickwise.at/desktopWeb/marketplace, Playwright, 09:22:56 | «Preis pro Anteil ab € …» | **Confirmado.** El texto es idéntico, línea a línea, al del investigador de las 09:06. |
| Ficha por ISIN | `https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`, 09:21:16–21 | — | **Confirmado.** 13 de las 14 respuestas tienen el mismo SHA-256 que las del investigador. En la de Fixpacht Hinterstoder (AT0000A35A42) solo cambia `debtInEurDate`, que es la hora del servidor. |
| Agente vinculado | BaFin, buscador de agentes vinculados (POST `nameVermittler=Brickwise`), 09:24:19 | «Brickwise Investment GmbH … 80174029 · Effecta GmbH · Florstadt · 04.08.2021» (columna «Tätig bis» vacía); «Stand der Daten: 09.11.2026» | Confirmado |
| Effecta en la BaFin | https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=133261, 09:24:27 | «Wertpapierinstitut · Bafin-ID: 10133261 … Anlagevermittlung (§ 2 Abs. 2 Nr. 3 WpIG) 26.06.2021» | Confirmado |
| Effecta en la CNMV | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?numero=5003&tipo=CLP y vistas 8 y 17, 09:24:33–35 | «5003 · 11/11/2020»; «Recepción y transmisión de órdenes … Valores negociables»; agentes: «No se han encontrado datos disponibles» | Confirmado |
| Advertencias de la CNMV | `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…` con Brickwise, Effecta, Brick Qogir, BrickOne, Brick Sagarmatha, Green-Point y Cohotel, 09:24:45–09:25:00 | «No hay datos disponibles.» Control con «Trading»: «Página 1 de 16» (09:24:42) | Confirmado: no hay advertencias y el buscador funciona |
| FMA (Austria) | https://www.fma.gv.at/en/?s=brickwise, `?s=effecta` y `?s=brick+qogir`, 09:25:07–10 | «0 Search results». Control con «investor warning»: «1224 Search results» | Confirmado |
| Acceso desde España | https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen, 09:25:20 | «Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» | Confirmado. El texto de la tarjeta («Sin confirmar: …», 116 caracteres) no exagera nada. |
| Comisión | https://api.app.brickwise.at/api/v1/utils/fees, 09:20:41; FAQ `was-kostet-der-handel-am-marktplatz`, 09:25:20 | `{"fees":0.015}`; «Vermittlungsgebühr von 1,5 % der jeweiligen Transaktionshöhe» | Confirmado |
| Comprar solo una parte de una orden | FAQ `wie-funktioniert-der-handel-am-marktplatz`, 09:25:20 | «Angebot (bestehend aus Preis pro Anteil und der Anzahl der angebotenen Wertpapiere) … direkt ausgewählt» | Confirmado: en ningún sitio dice que se pueda comprar solo una parte. El bloqueo sigue abierto. |
| Documentos | Los 55 PDF del inventario, descargados de nuevo entre las 09:23:34 y las 09:23:51 | — | **Confirmado.** Los 55 tienen el mismo SHA-256 que las copias del investigador. 54 coinciden también con el 05/11. El otro es el desistimiento de St. Pölten, que no estaba en el inventario del 05/11. Tabla: [`fuentes/brickwise/pdf-hashes-revisor.tsv`](fuentes/brickwise/pdf-hashes-revisor.tsv). |
| Sin desistimiento en reventa | `…/AT0000A2RAH5/AT0000A2RAH5_Ruecktrittsbelehrung.pdf`, 09:23 | «2. Kein Rücktrittsrecht am Zweitmarkt … Stand: 10.07.2026» | Confirmado |

## 2. Ficha por ficha

En la tabla, la venta más barata es el «Preis pro Anteil ab €» del mercado de
la app (09:22). Coincide con la venta más barata de la API v1 y con
`lowestOfferPrice` de la v2 (09:20). La columna «05/11 → 10/11» compara con lo
publicado y con el resumen del libro del 05/11
(`../2026-11-05-v2/grupos/brickwise/fuentes/brickwise/libro-ordenes-resumen-2026-11-05.json`).
Mi cálculo está en
[`fuentes/brickwise/libro-ordenes-revisor-2026-11-10.json`](fuentes/brickwise/libro-ordenes-revisor-2026-11-10.json).

| Ficha | Venta más barata · lote | En venta | Mejor compra | Lo que propone el investigador | Veredicto |
|---|---|---|---|---|---|
| Plüddemanngasse 101 | 75 € · 2 (orden del 04/11) | 335 | 20 € (1, orden del 23/04/2026) | Igual; solo re-fecha | **Confirmado.** El libro es idéntico al del 05/11: 22 ventas, 3 compras y las mismas cinco ventas más baratas. |
| Sonnleithnergasse 2 | 75 € · 11 (orden del 28/04/2026) | 97 | 65 € (1, orden del 16/10/2026) | Igual; solo re-fecha | **Confirmado.** Libro idéntico al del 05/11 (39 ventas y 9 compras). |
| Estanco Klagenfurt | 95 € · 16 en 3 órdenes (5 + 10 + 1) | 302 | 15 € (1, orden del 21/09/2026) | Igual; solo re-fecha | **Confirmado.** Libro idéntico al del 05/11 (47 ventas y 3 compras). |
| Stallhofstraße 28 | **68,80 €** · 1 (orden del 08/11) | 317 | 30 € (1, orden del 01/07/2026) | 69,90 → 68,80; 313 → 317 | **Confirmado** |
| Schwarzer Weg 18 | **65 €** · 1 (orden del 09/11) | 300 | 35 € (1, orden del 01/07/2026) | 66,67 → 65; 305 → 300 | **Confirmado.** Ya no está la orden de 6 a 66,67 €. |
| Drautalresidenz | 70 € · 3 (orden del 18/10/2026) | 150 | **60 €** (1, orden del 05/11/2026) | Igual; mejor compra 54 → 60 | **Confirmado** |
| Randhartingergasse 9 | 78 € · 21 en 2 órdenes (20 + 1) | 189 | **46 €** (1, orden del 09/11) | 184 → 189; 40,50 → 46; `availableBricks=374` | **Confirmado.** La portada renderizada (09:25:32) dice «Verfügbare Anteile 563» (374 + 189). |
| Hinterstoder 50 | **75 €** · 5 (orden del 08/11) | 265 | **20 €** (4 en 2 órdenes; la más antigua del 19/05/2025) | 77 → 75; 258 → 265; 65 → 20 | **Confirmado.** Ya no está la compra a 65 € del 30/09. |
| Pottendorfer Str. 62 | 74 € · 1 (orden del 09/11) | 107 | 19 € (3, orden del 06/11/2025) | Mismo precio, otra orden | **Confirmado.** La venta a 74 € del 05/11 ya no está; la de hoy es otra. |
| Fotovoltaica GreenPoint | 100 € · 5 (orden del 20/09/2026) | 351 | **84 €** (1, orden del 23/06/2026) | Igual; mejor compra 89 → 84 | **Confirmado** |
| Fotovoltaica Cohotel | 110 € · 35 en 2 órdenes (31 + 4) | 65 | 3 € (1, orden del 23/11/2024) | Libro idéntico; solo re-fecha | **Confirmado.** Libro idéntico al del 05/11 (5 ventas y 5 compras). |

`sharePrice` y `rentalReturn`, que solo van al expediente, también coinciden.
Por ejemplo: Hinterstoder 65 y 5,37; Schwarzer Weg 60 y 4,04.

**Muestreo de las «sin cambios».** No me limité a dos: comprobé con la fuente
de hoy **las 8** fichas que solo se re-fechan. En las 8, el precio, el lote, las
participaciones en venta y la mejor compra son los que dice el investigador.

### Avisos de alquiler y garantía (API por ISIN, 09:21:16–21 UTC, mismo SHA-256 que la copia del investigador)

| Ficha | Literal de hoy | Veredicto |
|---|---|---|
| Plüddemanngasse | «Es endet somit am 31.07.2024 ohne dass es einer gesonderten Aufkündigung bedarf.» | Sigue vigente |
| Sonnleithnergasse | `contractEndDate: 2026-11-29T17:00Z`; «Der aktuelle Mietvertrag wurde zum 30. September 2023 gekündigt … Derzeit wird ein Nachmieter gesucht» | Sigue vigente |
| Stallhofstraße | `contractEndDate: 2022-02-01T23:00Z`; «Das Mietverhältnis endet am 31.03.2027.» | Sigue vigente |
| Schwarzer Weg | «Das Mietverhältnis endet am 30.08.2023.» | Sigue vigente |
| Randhartingergasse | «vom Mieter gekündigt und endet am 28.02.2026. Es wird ein Nachmieter gesucht.» | Sigue vigente |
| Pottendorfer | «Das Mietverhältnis endet am 30.11.2025.»; «Grundbücherliche Besicherung noch ausstehend.» | Siguen vigentes los dos |
| GreenPoint / Cohotel | KID: «Beendigungszeitpunkt: 31.12.2038 (15 Jahre) ("endfällig")»; contrato: «Rückzahlungsanspruch (qualifiziert nachrangig)» | Sigue vigente |

Los 11 expedientes revisan todos los avisos publicados (salvo el aviso
editorial común), y todos con fuente y hora de hoy.

### Los tres textos de la tarjeta (punto 4 del encargo)

Solo cambia el **mínimo**, y solo en 3 fichas:

- Hinterstoder: «Desde 75 € la participación en reventa (10/11)», 46 caracteres;
- Schwarzer Weg: «Desde 65 € la participación en reventa (10/11)», 46 caracteres;
- Stallhofstraße: «Desde 68,80 € la participación en reventa (10/11)», 49 caracteres.

En las otras 8 cambia solo la fecha. Acceso desde España (116 caracteres) y
salida (81, 117 y 119 caracteres) se quedan como estaban. Los tres textos:

- están en castellano llano y tienen 120 caracteres o menos;
- tienen fuente y fecha;
- no llevan rentabilidad ni precio de emisión;
- usan la forma «la participación», no «por participación».

Cumplen las «Normas de las tarjetas». Comprobé los literales de salida:

- Pottendorfer, contrato 10.2: «erstmalig 15 (fünfzehn) Jahre ab dem Ausgabetag»;
- GreenPoint y Cohotel: el KID y el contrato de la tabla de arriba;
- las fichas con «Sin reembolso»: «Ordentliche Kündigung: Nein».

## 3. ¿Hay una emisión primaria abierta? BILLA → `no_admitir` confirmado

**Primaria nueva:**

- En la API v2 (09:20:40), el único activo con `stage=primary` es
  `AT0000A3SE89` (BILLA).
- En el mercado de la app (09:22:56), «Neue Objekte» solo muestra BILLA.
- La portada renderizada (09:25:32) sigue con «Neue Immobilie: coming soon».

Además consulté el launchpad **sin filtro**
(`https://api.app.brickwise.at/launchpad/api/v2/assets`, 09:25:49):

- devuelve 115 activos de varios socios;
- del socio `brickwise`, aparte de BILLA, solo hay otro `primary`:
  `AT0000A31LK6` (Neugasse 40a). Su plazo terminó el 31/12/2022, se tocó por
  última vez el 09/12/2022 y no sale en la app ni en las API v1 y v2. Es un
  registro viejo, no una emisión abierta.

**Confirmado: no hay ninguna primaria nueva.**

**BILLA** (API por ISIN, 09:21:21; ficha de la app, 09:23:02):

- `availableBricks 6322` de `totalBricks 6404` → **82 suscritas**, es decir,
  8.200 €, el 1,64 % de 500.000 €.
- `issueEndDate` = `issueEndDateOriginal` = `2026-05-15T22:00Z` → la API no
  registra ninguna prórroga.
- La app sigue mostrando «+ Weitere Anteile kaufen», «Mindestinvestition
  € 1.000,00», «Verfügbare Anteile 6.322» y «Erwartet ab 14.7.2026».
- Documentos (mismo SHA-256):
  - Informationsblatt: «(„Zeichnungsfrist") endet am 16.05.2026 um 23:59 Uhr»,
    «Mindestkapitalbedarf des Emittenten beträgt EUR 500.000,00» y «negatives
    Eigenkapital in Höhe von rund EUR 83.000,00»;
  - contrato: «Mindestausgabemenge: 5.000»;
  - desistimiento: «innerhalb von 14 Tagen».
- Garantía: «Grundbücherliche Besicherung noch ausstehend.»

Intenté rebatir el `no_admitir` y no pude:

- el plazo publicado venció hace casi seis meses y no hay prórroga publicada;
- apenas lleva un 1,64 % del umbral;
- no consta que se distribuya en España;
- sin sesión no se puede saber si la app acepta de verdad la suscripción.

**`no_admitir` confirmado.** St. Pölten (219 de 460, sin órdenes de reventa) y
Fixpacht Hinterstoder (68 en venta, desde 94,90 €) siguen como dice el
investigador.

**En línea.** Según la lectura pública del coordinador
(`lectura-publica/ofertas-v2.json`, 08:58), las 11 fichas siguen como
`no_verificable` y con fecha del 05/11. Confirmado. No consulté Supabase.

## 4. Datos personales en las copias del grupo (punto 6)

Los 12 expedientes, el resumen, el inventario y el resumen del libro de
órdenes están limpios: no hay nombres, carteras ni tokenId. Las copias de la
FAQ, del aviso legal y de la BaFin llevan el nombre recortado.

**Pero hay dos copias, fuera de `crudo/`, con nombres de personas físicas:**

1. `grupos/brickwise/fuentes/brickwise/contrato-AT0000A3SE89.pdf` y su texto
   `contrato-AT0000A3SE89.pdf.txt` (líneas 218–219). El contrato de BILLA
   nombra como «Gemeinsamer Vertreter» a un abogado, persona física, con el
   nombre completo y la dirección del despacho. El resumen del grupo dice que
   los PDF con nombres se movieron a `crudo/`, pero este no se movió y su
   texto no se recortó.
2. `grupos/brickwise/fuentes/brickwise/info-AT0000A324B4.pdf.txt`, línea 2044.
   En la tabla de activos del Informationsblatt de Pottendorfer aparece un
   proveedor que es una persona física: apellido, título y nombre. El PDF ya
   está en `crudo/` y el investigador recortó otros dos nombres de este mismo
   texto, pero este se le escapó.

En Pottendorfer, el «Gemeinsamer Vertreter» del contrato es un despacho con
forma de sociedad (GmbH). No es una persona física y puede quedarse.

## 5. Correcciones

**Obligatoria (no cambia ninguna tarjeta):**

1. Mover `grupos/brickwise/fuentes/brickwise/contrato-AT0000A3SE89.pdf` a
   `grupos/brickwise/fuentes/crudo/`. Recortar el nombre y la dirección del
   abogado en `contrato-AT0000A3SE89.pdf.txt` (líneas 218–219) y el del
   proveedor en `info-AT0000A324B4.pdf.txt` (línea 2044), con «[persona física
   recortada]». Actualizar `archivo` y `sha256` en `inventario-consultas.json`.

**Recomendadas (no bloquean):**

2. **Hinterstoder**, claim `salida`: el literal dice «(siehe zu den Ausnahmen
   Punkt 11)», pero el contrato de esta emisión
   (`cdn.brickwise.at/8a16682d-….pdf`) dice «Ziffer 11». Hay que copiarlo
   exacto. El sentido es el mismo y la tarjeta no cambia.
3. **Resumen del grupo:** decir que el launchpad sin filtro tiene otro
   registro de Brickwise con `stage=primary` (AT0000A31LK6, de 2022), que no
   está abierto ni sale en la app. Así nadie lo confunde con una emisión
   nueva.
4. **Hinterstoder, ficha completa:** la venta más barata es un lote de 5
   participaciones a 75 €. Si no se puede comprar solo una parte, la entrada
   real son 375 € más el 1,5 %. La tarjeta sigue la norma del día («Desde 75 €
   la participación…») y la ficha ya lo dice («5 a ese precio»). Pasa lo mismo
   con Sonnleithnergasse (11), Klagenfurt (lotes de 5, 10 y 1), Drautal (3),
   GreenPoint (5) y Cohotel (31 y 4).

## 6. Observaciones y bloqueos

- **Schwarzer Weg.** La orden de 65 € tuvo un comprador interesado: tiene
  `interestedParty`, y su `interestedPartyCooldown` venció el 09/11 a las
  21:54 UTC. Sigue `open`, y la app la muestra como precio «ab € 65,00». No
  cambia el mínimo, pero puede desaparecer pronto.
- **Bloqueos del investigador, que sigo sin poder resolver:**
  - el Firmenbuch es de pago;
  - `sharePrice` no tiene metodología;
  - no se sabe si se puede comprar solo una parte de una orden;
  - la API solo enseña órdenes abiertas, así que no se sabe si las que
    desaparecen se ejecutaron o se retiraron;
  - de BILLA no hay prórroga publicada, y sin sesión no se puede probar una
    suscripción.
- **Lo que no repetí:** las búsquedas de la FMA con «brickone» y «brick
  sagarmatha», y la de la CNMV con «Brickwise Real Estate». La búsqueda de la
  CNMV con «Brickwise» no da nada, y las demás del mismo tipo funcionan.
