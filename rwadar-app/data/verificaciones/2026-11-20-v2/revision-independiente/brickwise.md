# Revisión independiente · grupo brickwise · 20/11/2026

Revisor independiente (no preparé los expedientes). Consultas propias entre
las 17:01 y las 17:04 UTC del 20/11/2026, sin sesión ni cuenta. Copias en
`fuentes/brickwise/` (crudos en `fuentes/brickwise/crudo/`, fuera de Git).

## Veredicto global: aprobado

Las 11 fichas siguen en reventa con vendedores. Los dos cambios de mínimo
(Pottendorfer 80 → 81 €, Cohotel 102 → 110 €) se sostienen con la fuente de
hoy. Las otras nueve también cuadran cifra por cifra. No hay correcciones
obligatorias.

## Qué abrí yo y qué vi

**Libro de órdenes, API pública**
- `https://api.app.brickwise.at/api/v1/assets`, HTTP 200, 17:01:14 UTC.
  SHA-256 `895fcaef…026b`: el mismo que el del investigador y el del vigía,
  así que los datos son idénticos.
- `https://api.app.brickwise.at/api/v2/assets`, HTTP 200, 17:01:14 UTC.
  SHA-256 `db1b9ef9…a9b`: también el mismo.
- Calculé por mi cuenta, desde las órdenes abiertas de la v1, la venta más
  barata, cuántas participaciones hay a ese precio, la orden de menor importe
  (con el 1,5 %), el total en venta y la mejor compra. El resultado está en
  `fuentes/brickwise/libro-revisor-2026-11-20.json` y coincide en las 11 con
  los expedientes. El `lowestOfferPrice` de la v2 también coincide: 75, 75,
  95, 68.8, 69.9, 70, 78, 75, 81, 102 y 110.

**Mercado de la app**
- `https://app.brickwise.at/desktopWeb/marketplace`, abierto con Playwright y
  sin sesión, a las 17:03:12 UTC (`web-app-marketplace-revisor-2026-11-20.txt`
  y `.png`). «Preis pro Anteil ab» da:
  - Plüddemanngasse € 75,00; Sonnleithnergasse € 75,00; Trafik Klagenfurt
    € 95,00;
  - Stallhofstraße € 68,80; Schwarzer Weg € 69,90; Drautalresidenz € 70,00;
  - Randhartingergasse € 78,00; Hinterstoder 50 € 75,00;
    **Pottendorfer € 81,00**;
  - GreenPoint € 102,00; **Cohotel € 110,00**.
- Todas llevan «Handel aktiv» y «Bestand», y ninguna sale en
  «Finanzierungsphase».

**Cambios críticos**
- **Cohotel (AT0000A38J40):** hay dos órdenes a 110 €, de 31 y de 4
  participaciones (creadas el 07/02/2025 y el 07/05/2026). La de menor
  importe es 1 a 120 € (15/11), que con el 1,5 % son 121,80 €. Hay 59 en
  venta y la mejor compra es 3 € (23/11/2024). La venta de 102 € ya no está.
- **Pottendorfer (AT0000A324B4):** hay 1 participación a 81 € (orden del
  15/11), 82,22 € con el 1,5 %. Hay 96 en venta y la mejor compra es 64 €
  (17/11). La orden de 80 € ya no está.
- Ninguna de las órdenes más baratas de las 11 fichas tiene hoy un bloqueo
  activo por interesado: todos los `interestedPartyCooldown` son de fechas ya
  pasadas.

**Comprobaciones por muestreo de lo que viene del vigía**
- Revisé con un script los 166 datos marcados `segunVigia` de las 11 fichas.
  Todos están en `vigia.json` como «no cambia», con la misma hora y, en los
  documentos, el mismo SHA-256. No hay ninguno marcado «cambia», «no se pudo
  leer» ni que falte en el vigía.
- Descargué de nuevo, a las 17:01:54–55 UTC:
  - contrato de Cohotel `d72ef1c5…pdf`: SHA-256 `1b2f693c…bb40`, igual;
  - KID de Cohotel `da8e1df3…pdf`: SHA-256 `a9cd9368…888f`, igual;
  - `Kosteninformationen_Brickwise.pdf`: SHA-256 `3ddf8882…862b`, igual;
  - Rücktrittsbelehrung de AT0000A324B4: SHA-256 `63ece51e…c567`, igual;
  - `03bdd125…pdf` de Pottendorfer: SHA-256 `da458b99…ca67`, igual;
  - Informationsblatt de Cohotel `8dfb7e84…pdf`, que el investigador bajó a
    mano: SHA-256 `b98ac9fe…52e5`, igual.
- Advertencias de la CNMV
  (`https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`), entre las
  17:01:56 y las 17:02:01 UTC: Brickwise, Effecta, Cohotel y Green-Point dan
  «No hay datos disponibles». La huella del HTML no coincide con la del vigía
  porque la página cambia en cada petición, pero el resultado es el mismo.

**Registros**
- CNMV, Effecta (`…/ESISExtranjerasLP?numero=5003&tipo=CLP`), 17:02:14–28 UTC:
  - «Nº Registro Oficial … 5003 11/11/2020», Florstadt, Alemania;
  - programa: «Recepción y transmisión de órdenes … Valores negociables …
    Participaciones y acciones en instituciones de inversión colectiva»;
  - agentes: «No se han encontrado datos disponibles».
  Coincide con los expedientes.
- La BaFin no la reabrí. El pie del mercado de la app dice hoy «Brickwise
  Investment GmbH … vertraglich gebundener Vermittler gemäß § 3 (2) WpIG der
  Effecta GmbH», lo que es coherente con el expediente.

**Compra parcial y acceso desde España**
- FAQ `https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz`,
  17:02:09 UTC, SHA-256 `52d2e527…1e80` (el mismo que el del investigador).
  Dice: «Ist ein dort verfügbares Angebot (bestehend aus Preis pro Anteil und
  der Anzahl der angebotenen Wertpapiere) interessant, kann dieses direkt
  ausgewählt werden».
- El aviso de que «no consta que se pueda comprar solo una parte» sigue
  respaldado.

## Textos de la tarjeta (punto 4)

- Las 11 fichas usan «Desde X € la participación en reventa (20/11)», de 46
  a 49 caracteres, con el mismo formato que lo publicado el 13/11.
- «Acceso desde España» (116 caracteres) y «Salida» (de 81 a 119 caracteres)
  son literalmente los publicados el 13/11.
- Todos los textos están en castellano llano, tienen 120 caracteres o menos,
  llevan fecha y no muestran rentabilidad ni precio principal (es reventa).
- En Cohotel, la venta más barata obliga a comprar 4 o 31 participaciones a
  110 €; la orden de 1 participación es a 120 €. «Desde 110 € la
  participación» es correcto como precio unitario, y el aviso de que no
  consta la compra parcial cubre el resto.

## Datos personales (punto 6)

- En las copias del grupo, los nombres de las FAQ y del Impressum están
  recortados («[nombre recortado]»). `max.mustermann@email.com` es el
  marcador de ejemplo de la propia web.
- El resumen del libro de órdenes no lleva carteras ni identificadores.
- Los crudos de la API, que sí llevan identificadores de orden y de usuario,
  están en `crudo/`, que Git ignora; lo comprobé con `git check-ignore`. Los
  míos están en `revision-independiente/**/crudo/`, también ignorado.

## Bloqueos y matices

- **FMA:**
  - La búsqueda general `https://www.fma.gv.at/en/?s=brickwise` me da 403
    «Just a moment» (Cloudflare) a las 17:04:15 UTC. Confirma el bloqueo.
  - La base de empresas `…/search-company-database/?cname=brickwise` me da
    200 a las 17:04:15 UTC (el investigador anotó 403 a las 16:56:54). Pero
    el HTML estático no trae el bloque de resultados, ni «No entries found»
    ni coincidencias, así que no sirve como lectura nueva. Sigue valiendo la
    del 11/11. No es un problema para publicar.
- La API solo enseña las órdenes abiertas. No se puede saber si las de
  102 € (Cohotel), 80 € (Pottendorfer) y la compra de 84 € (GreenPoint) se
  ejecutaron o se retiraron. Ningún texto lo afirma.
- Randhartingergasse: `availableBricks=374` con `stage=secondary`. Es la
  anomalía conocida; el mercado de la app la muestra en «Bestand» y no en
  «Finanzierungsphase».
- No consulté el Firmenbuch, que es de pago.
- Redondeo: algunos importes con el 1,5 % caen en medio céntimo (99 × 1,015
  = 100,485; 85 × 1,015 = 86,275; 81 × 1,015 = 82,215). Los expedientes
  redondean hacia arriba, igual que el 13/11. Es correcto.

## Correcciones obligatorias

Ninguna.
