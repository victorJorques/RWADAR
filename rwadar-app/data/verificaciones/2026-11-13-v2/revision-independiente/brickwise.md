# Revisión independiente · grupo `brickwise` · 13/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo las fuentes
primarias entre las **08:41 y las 08:48 UTC** del 13/11/2026, con `curl` y
Playwright (Chromium sin opciones), sin sesión, sin cuenta y sin formularios.
Copias en `fuentes/brickwise/` (extractos y resumen del libro de órdenes, sin
datos personales) y `fuentes/brickwise/crudo/` (respuestas completas, PDF y
captura, fuera de Git). Inventario con hora y SHA-256:
`fuentes/brickwise/inventario-revisor.json`.

## Veredicto

**Aprobado.** Las 11 fichas quedan en `actualizar`, como propone el
investigador. Todas las cifras que cambian coinciden con lo que leí hoy, en la
API y en la app. No hay correcciones obligatorias.

| Ficha | Lo que cambia | Mi lectura (API 08:41:37 UTC · app 08:43 UTC) | Veredicto |
|---|---|---|---|
| Pottendorfer Straße 62 | Mínimo 80 → **73 €** | Venta más barata 73 € (1 participación, orden creada el 12/11 a las 21:45:35 UTC, sin interesado apuntado). App: «Preis pro Anteil ab € 73,00» | confirmado |
| Pottendorfer Straße 62 | Orden de menor importe 1 × 115 € → **1 × 73 € (74,10 €)** | 73 × 1,015 = 74,095 → 74,10 € (redondeo normal) | confirmado |
| Fotovoltaica Cohotel | En venta 65 → **59** | v1 y v2 `availableBricksSecondary` 59; suma de ventas abiertas 59 | confirmado |
| Fotovoltaica GreenPoint | En venta 351 → **347** | v1 y v2: 347; suma de ventas abiertas 347 | confirmado |
| Schwarzer Weg 18 | En venta 300 → **299** | v1 y v2: 299; suma 299 | confirmado |
| Pottendorfer Straße 62 | En venta 107 (solo fecha) | v1 y v2: 107 | confirmado |
| Randhartingergasse 9 | Mejor compra 56 → **64 €** | Mejor compra 64 € (1, creada el 12/11 a las 15:34 UTC). No hay ninguna compra abierta a 56 € | confirmado |
| Las otras 6 | Solo la fecha (13/11) | Libro igual que el publicado el 12/11 | confirmado |

Totales del tablón a las 08:41:37 UTC: **423 ventas y 95 compras abiertas**,
todas `contactType "bulletin"` (igual que dice el investigador).

## Lo que comprobé y cómo

### 1. Libro de órdenes (las 11 fichas)

- `https://api.app.brickwise.at/api/v1/assets`, 08:41:37 UTC, HTTP 200,
  236.872 B, SHA-256 `d04d417f…ce9a`. Es **el mismo archivo** que leyó el
  investigador a las 08:30:44. Lo repetí a las 08:48:00: idéntico. La orden de
  73 € de Pottendorfer seguía abierta.
- `https://api.app.brickwise.at/api/v2/assets`, 08:41:37 UTC, SHA-256
  `197a25e3…e1dd1`, igual que el del investigador. `lowestOfferPrice` coincide
  con la venta más barata de la v1 en las 11.
- Calculé por mi cuenta, con aritmética decimal exacta, la venta más barata,
  cuántas hay a ese precio y en qué órdenes, la orden de menor importe más el
  1,5 % y la mejor compra (`libro-ordenes-revisor-2026-11-13.json`):

| Ficha | Venta más barata | Orden de menor importe (+1,5 %) | En venta | Mejor compra |
|---|---|---|---|---|
| Hinterstoder 50 | 75 € (5; 08/11) | 1 × 90 → 91,35 € | 265 | 20 € (1 + 3) |
| Drautalresidenz | 70 € (3; 18/10) | 1 × 84 → 85,26 € | 150 | 60 € (1) |
| Cohotel | 102 € (1; 11/11) | 1 × 102 → 103,53 € | 59 | 3 € (1) |
| GreenPoint | 102 € (5 + 2 + 1) | 1 × 102 → 103,53 € | 347 | 84 € (1) |
| Klagenfurt | 95 € (5 + 10 + 1) | 1 × 95 → 96,43 € | 302 | 15 € (1) |
| Randhartingergasse | 78 € (20 + 1) | 1 × 78 → 79,17 € | 189 | 64 € (1; 12/11) |
| Plüddemanngasse | 75 € (2; 04/11) | 1 × 99 → 100,49 € | 335 | 20 € (1) |
| Pottendorfer | **73 € (1; 12/11)** | **1 × 73 → 74,10 €** | 107 | 19 € (3) |
| Schwarzer Weg | 69,90 € (1; 27/10) | 1 × 69,90 → 70,95 € | 299 | 60 € (1) |
| Sonnleithnergasse | 75 € (11; 28/04) | 1 × 80 → 81,20 € | 97 | 65 € (1) |
| Stallhofstraße | 68,80 € (1; 08/11) | 1 × 68,80 → 69,83 € | 317 | 30 € (1) |

Todo coincide con `referenciasFicha`, `claims`, `prioridadEditorial` y
`cambiosRespectoPublicado` de los 11 expedientes, y con
`grupos/brickwise/resumen-brickwise.md`.

### 2. Lo publicado (el «antes»)

Comparé los «antes» con la lectura pública del 13/11 a las 08:27 UTC
(`lectura-publica/ofertas-v2.json`, revisión `a58dd22d`). Coinciden: mínimo de
Pottendorfer «Desde 80 € … (12/11)», «Participaciones en venta · 11/11/2026»
65 (Cohotel), 351 (GreenPoint) y 107 (Pottendorfer), «· 10/11/2026» 300
(Schwarzer Weg), y «Mejor oferta de compra» 56 € en Randhartingergasse.
Resumen, métricas, avisos, título, colección y URL de las 11 propuestas son
idénticos a `../2026-11-12-v2/escaparate-publicacion.json`: solo cambian
fechas y las cifras de arriba.

### 3. Mercado de la app

`https://app.brickwise.at/desktopWeb/marketplace`, Playwright, 08:43:31–08:43:52
UTC (texto en `mercado-app-revisor-2026-11-13.txt`). Las 11 fichas dicen
«Handel aktiv» y «Preis pro Anteil ab €» con el mismo precio que la API:
78,00 · 102,00 · 102,00 · 75,00 · 75,00 · 95,00 · 68,80 · 69,90 · 70,00 ·
75,00 · **73,00** (Pottendorfer, con «4,16 % p.a.», que no se publica).
Randhartingergasse sale en reventa, no en «Neue Objekte»: el
`availableBricks: 374` de la API no es una reapertura.

### 4. Documentos

Descargué los **46 PDF** (contrato, KID, hoja informativa y Rücktrittsbelehrung
de cada emisión, Kosteninformationen y condiciones de uso) entre las 08:44:03 y
las 08:44:19 UTC. Los 46 tienen **el mismo SHA-256 que los expedientes del
12/11** (lo comparé con `../2026-11-12-v2/expedientes/`, no solo con el
investigador).

Las fichas de la API por emisión
(`https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`, 08:44:33–08:44:37)
son iguales campo a campo a las copias del 12/11; en Pottendorfer solo cambia
`updatedAt`. Siguen:

- «Das Mietverhältnis endet am 30.11.2025.» (Pottendorfer) y los demás textos
  de alquiler: los avisos del alquiler siguen vigentes.
- `landRegisterMortgageStatusText`: «Grundbücherliche Besicherung noch
  ausstehend.»: el aviso de la garantía pendiente sigue vigente.

Salidas de la tarjeta, comprobadas en los PDF de hoy:

- Cohotel y GreenPoint, KID p. 1: «Beendigungszeitpunkt: 31.12.2038 (15 Jahre)
  ("endfällig")» y reembolso «qualifiziert nachrangig». (La app enseña
  «Laufzeit: 30.12.2038» porque la API da `2038-12-30T23:00:00Z`, que en Viena
  es el 31/12; no es un conflicto.)
- Pottendorfer, contrato: «ordentliche Kündigung … erstmals nach 15
  (fünfzehn) Jahren ab dem Ausgabetag».

### 5. Comisiones, compra parcial y acceso desde España

- `https://api.app.brickwise.at/api/v1/utils/fees`, 08:41:38 UTC:
  `{"data":{"fees":0.015}}`.
- Kosteninformationen (mismo SHA-256): «Vermittlungsgebühr 1,50% … jedem/jeder
  Investor:in, die an einer Transaktion beteiligt ist (Käufer:in und
  Verkäufer:in)».
- FAQ del mercado (08:45:02, mismo SHA-256 `52d2e527…` que el investigador):
  «Ist ein dort verfügbares Angebot (bestehend aus Preis pro Anteil und der
  Anzahl der angebotenen Wertpapiere) interessant, kann dieses direkt
  ausgewählt werden.» La compra parcial sigue sin confirmar: el aviso común
  sigue siendo correcto.
- FAQ de países (mismo SHA-256 `d652644e…`): «Jede Person mit einem Wohnsitz
  in einem der EWR-Mitgliedstaaten kann einen Account eröffnen.» Sostiene el
  «Sin confirmar: cuenta para residentes del EEE (España incluida)…».
- El mercado carga hoy `js/app.85dda63a.js` (SHA-256 `b5c9c154…`, igual).

### 6. Registros y advertencias

- **CNMV**, EFFECTA GmbH (08:45:20–08:45:25, `accept-language: es`; la URL
  `.aspx` responde 301 y se sigue a `/portal/Consultas/ESI/ESISExtranjerasLP`):
  «Nº Registro Oficial 5003 · Fecha registro oficial 11/11/2020 · ALEMANIA»;
  programa: «Recepción y transmisión de órdenes … 1) Valores negociables · 3)
  Participaciones y acciones en instituciones de inversión colectiva»; agentes:
  «No se han encontrado datos disponibles».
- **Advertencias de la CNMV** (08:45:41–08:45:58): «No hay datos disponibles.»
  para Brickwise, Effecta, Brick Qogir, Brick Sagarmatha, BrickOne, Cohotel,
  Green-Point y Green Point. El buscador funciona: «Trading» da «Página 1 de
  16 · Resultado de búsqueda de Advertencias de la CNMV».
- **BaFin** (08:46:09–08:46:11): Effecta GmbH, Wertpapierinstitut, BaFin-ID
  10133261, Anlageberatung y Anlagevermittlung desde el 26.06.2021. Brickwise
  Investment GmbH, agente vinculado n.º 80174029 de Effecta, «Tätig ab
  04.08.2021», columna «Tätig bis» vacía. «Stand der Daten: 12.11.2026».

### 7. Datos personales en las copias del grupo

Busqué en `grupos/brickwise/` fuera de `crudo/` (textos de `fuentes/web` y
`fuentes/reguladores`, `libro-ordenes-resumen-2026-11-13.json`, resumen,
inventario) y en los 11 expedientes:

- ninguna dirección de cartera (`firstParty`, `interestedParty`) ni `tokenId`;
- el representante de la BaFin y el gerente del aviso legal salen como
  «[persona física recortada]» y «[nombre recortado]»;
- el `.gitignore` del grupo deja fuera `fuentes/crudo/`.

Correcto.

## Bloqueos (míos, hoy)

- **FMA (Austria):** `https://www.fma.gv.at/en/?s=brickwise`, 08:46:24 UTC,
  HTTP 403 «Just a moment...» (Cloudflare). Un solo intento con `curl` normal;
  no se elude. Coincide con el bloqueo del investigador. No cambia nada de lo
  publicado: la última lectura válida es del 11/11 y los registros de la CNMV y
  la BaFin se han leído hoy.
- **Compra parcial de una orden:** sigue sin confirmar. Lo cubre el aviso común.
- **La API solo enseña órdenes abiertas:** no se sabe si la compra de 56 € de
  Randhartingergasse se ejecutó o se retiró. No afecta a la tarjeta.

## Correcciones obligatorias

Ninguna.

## Recomendaciones (no obligatorias)

1. **Pottendorfer: volver a mirar la orden de 73 € justo antes de aplicar el
   SQL.** Es una sola participación, y el 11/11 una orden de 73 € de esta misma
   ficha desapareció en unos 20 minutos (ACCESO-FUENTES, sección 2.4 d). Hoy
   lleva abierta desde el 12/11 a las 21:45 UTC y seguía a las 08:48 UTC. Si ya
   no está, poner la venta más barata de ese momento, con su fecha.
2. En el inventario del investigador, las tres URL `.aspx` de la CNMV constan
   con HTTP 200; hoy responden 301 y redirigen a la ruta nueva. Conviene anotar
   la redirección. No cambia ningún dato.
