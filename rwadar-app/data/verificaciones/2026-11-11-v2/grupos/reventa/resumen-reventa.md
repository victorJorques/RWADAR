# Grupo reventa · resumen del 11/11/2026

Revisé las 14 fichas de reventa del grupo entre las 09:15 y las 09:33 UTC del
11/11/2026. Son 11 de Brickwise y 3 de Aktionariat (Aktionariat, Boss Info y
Switzerlend). Partí de los expedientes del 10/11 y volví a abrir hoy cada
fuente.

Todo lo leí sin iniciar sesión y desde fuentes públicas:

- las API de Brickwise y de los portales de Aktionariat;
- los portales y el mercado de la app, con el navegador (Playwright);
- los PDF de cada emisión;
- lecturas en cadena de solo lectura (`eth_call`);
- los registros de BaFin, CNMV, FMA, FINMA, Zefix y PolyReg.

En el mercado entre accionistas pulsé la pestaña «Sell» solo para leer la
comisión. No envié ninguna orden.

- **Dónde está cada cosa:** la hora, el código HTTP, el tamaño y el SHA-256 de
  cada consulta están en `inventario-consultas.json`.
- **Fuera de Git:** las respuestas crudas, con carteras, tokenId y HTML con
  nombres, están en `fuentes/crudo/`.
- **Nombres recortados:** en las copias de texto los nombres de personas
  físicas aparecen como «[persona física recortada]».

## En una frase

Hoy cambia poco:

- **Brickwise:** cambia el precio del mínimo en 2 fichas (Schwarzer Weg y
  Pottendorfer). La mejor compra sube en otras 2 (Schwarzer Weg y
  Randhartingergasse).
- **Aktionariat, Boss Info y Switzerlend:** no cambia nada de fondo. Solo hay
  que pasar las fechas al 11/11.

## Brickwise: lo común (todo igual que el 10/11)

- **Quién vende:** Brickwise Investment GmbH, agente vinculado nº 80174029 de
  Effecta GmbH (BaFin-ID 10133261).
  - En la BaFin sigue activa y sin fecha de baja; los datos son a 10/11/2026.
  - En la CNMV, Effecta tiene el nº 5003, en libre prestación y solo para
    recibir y transmitir órdenes. En «Agentes» pone «No se han encontrado
    datos disponibles».
- **Advertencias:** ninguna.
  - La CNMV no tiene advertencias para Brickwise, Effecta, Brick Qogir,
    BrickOne, Brick Sagarmatha, Green-Point, Cohotel ni Brickwise Real
    Estate. Su buscador funciona: con «Trading» devuelve «Página 1 de 16».
  - La FMA da 0 resultados para las cinco búsquedas. Su buscador funciona:
    «investor warning» devuelve 1.224 resultados.
- **Bloqueo nuevo, ya resuelto:** hoy el buscador de la FMA devuelve 403
  (Cloudflare) a curl. Lo leí con el navegador, sin sesión.
- **Documentos:** volví a descargar los 55 PDF. Los 55 tienen el mismo SHA-256
  que el 05/11 y el 10/11, así que no ha cambiado ninguno.
- **Comisión:** sigue en 1,5 % por operación (la API dice `fees: 0.015`).
- **Acceso desde España:** sin confirmar, igual que ayer. La FAQ admite
  cuentas de cualquier residente del EEE, pero no consta que cada emisión se
  distribuya en España.
- **Imprint y FAQ:** mismo texto que el 10/11.
- **Alquileres:** los textos de la API son los mismos que ayer.
  - En 9 de las 11 fichas la respuesta de la API es idéntica byte a byte.
  - En Pottendorfer solo cambia `updatedAt`. La garantía sigue «noch
    ausstehend».
  - En Schwarzer Weg cambian `sharePrice` (60 → 65) y `rentalReturn`
    (4,04 → 3,73). Son solo del expediente y no se publican.

## Brickwise: precios de hoy (API a las 09:16 y app a las 09:20 UTC)

La venta más barata de la API coincide en las 11 fichas con el «Preis pro
Anteil ab» del mercado de la app.

| Ficha | Venta más barata 10/11 → 11/11 | En venta | Mejor compra 10/11 → 11/11 |
|---|---|---|---|
| Plüddemanngasse 101 (Graz) | 75 € → 75 € (2) | 335 | 20 € → 20 € |
| Sonnleithnergasse 2 (Viena) | 75 € → 75 € (11) | 97 | 65 € → 65 € |
| Estanco Klagenfurt | 95 € → 95 € (16, en 3 órdenes) | 302 | 15 € → 15 € |
| Stallhofstraße 28 (Gratwein) | 68,80 € → 68,80 € (1) | 317 | 30 € → 30 € |
| **Schwarzer Weg 18 (Graz)** | **65 € → 69,90 €** (1, orden del 27/10) | 300 → 299 | **35 € → 60 €** (orden del 10/11) |
| Drautalresidenz (Paternion) | 70 € → 70 € (3) | 150 | 60 € → 60 € |
| **Randhartingergasse 9 (Viena)** | 78 € → 78 € (21, en 2 órdenes) | 189 | **46 € → 56 €** (orden del 10/11) |
| Hinterstoder 50 | 75 € → 75 € (5) | 265 | 20 € → 20 € |
| **Pottendorfer Straße 62** | **74 € → 73 €** (1, orden del 11/11) | 107 | 19 € → 19 € |
| Fotovoltaica GreenPoint | 100 € → 100 € (5) | 351 | 84 € → 84 € |
| Fotovoltaica Cohotel | 110 € → 110 € (35, en 2 órdenes) | 65 | 3 € → 3 € |

Notas sobre la tabla:

- En Schwarzer Weg ya no está la venta de 65 € del 09/11. La API solo
  enseña las órdenes abiertas, así que no se sabe si se vendió o se retiró.
- En Pottendorfer, la venta de 74 € del 09/11 ya no está. Hay otra nueva, de
  hoy (07:56 UTC), a 73 €.

**Qué cambia en las tarjetas (las 11 → actualizar):**

- **Mínimo:** cambia el precio en 2 fichas:
  - Schwarzer Weg: «Desde 69,90 € la participación en reventa (11/11)»;
  - Pottendorfer: «Desde 73 € la participación en reventa (11/11)».

  En las otras 9 el precio es el mismo y solo pasa la fecha a (11/11). Es un
  precio de reventa del día, no de emisión.
- **Acceso desde España y salida:** no cambian.
- **Avisos:** todos siguen vigentes, con fuente y hora de hoy en
  `revisionAvisos`.
- **Ficha completa:** se actualizan la venta más barata, las participaciones
  en venta y la mejor compra, con fecha 11/11/2026.
- **Rentabilidad:** no se muestra, porque son tarjetas de reventa. Las
  cifras «% p.a.» de la app se quedan en el expediente.
- **Colección:** se mantienen en «secundario».

## Brickwise: emisiones primarias abiertas hoy

- **Solo BILLA (AT0000A3SE89).** Es el único activo con `stage=primary`, con
  6.322 participaciones disponibles, igual que ayer. En la app aparece en
  «Neue Objekte» con un mínimo de 1.000 €.
  - La respuesta de la API es idéntica byte a byte a la del 10/11.
  - Sigue igual que cuando Víctor la retiró. No hay expediente nuevo: su
    `no_admitir` del 10/11 sigue valiendo.
- **Ninguna emisión nueva.** La portada sigue con «Neue Immobilie: coming
  soon».
- **St. Pölten:** la app enseña «Preis pro Anteil ab € 507,62», igual que el
  10/11. Sigue sin órdenes de reventa.
- **Randhartingergasse:** sigue `availableBricks=374` sin explicar. La
  portada suma 563 «Verfügbare Anteile».

## Aktionariat, Boss Info y Switzerlend (→ actualizar, solo fechas)

Lo que dicen hoy las fuentes primarias:

- **Operaciones:** el historial completo de los tres es idéntico byte a byte
  al de ayer. No hay ninguna operación nueva.
  - Última compra al emisor: Aktionariat el 31/10/2026, Boss Info el
    29/06/2026 y Switzerlend el 07/10/2026.
  - Última operación de Boss Info: el 05/11/2026, 1 acción a 8,40 ZCHF entre
    accionistas.
- **Libros de órdenes:** iguales a los de ayer. Solo cambia la hora de
  actualización.
  - Aktionariat: compra 6,10 × 10 y venta 6,20 × 356.
  - Boss Info: compra 7,30 × 1.000 y venta 8,40 × 103.
  - Switzerlend: compra 59,00 × 4 y venta 67,00 × 15.
- **Precio del emisor, en cadena:** igual que ayer.
  - Aktionariat: 7,25.
  - Boss Info: 8,50197.
  - Switzerlend: 68,0105.
- **Recompra:**
  - Aktionariat: cerrada.
  - Boss Info: cerrada por «ventana de mantenimiento».
  - Switzerlend: apagada en el contrato y con 0,03 ZCHF, aunque su web dice
    que se puede revender al emisor. Este conflicto sigue igual.
- **Comisión de venta:** 1,9 %, en el portal y en el contrato
  (`tradingFeeBips()=190`).
- **Documentos:** los PDF tienen el mismo SHA-256 que ayer.
  - El aviso legal y las condiciones de Aktionariat tienen el mismo HTML.
  - Las condiciones de los tres portales, la FAQ y la página de tokens de
    Boss Info y la página de inversores de LEND cambian de SHA-256 en el
    HTML, pero dicen lo mismo palabra por palabra.
- **Registros:**
  - FINMA: 0 resultados para los tres, con la respuesta idéntica a la de
    ayer.
  - Lista de advertencias de FINMA: tiene 2.404 entradas (2 más que ayer) y
    ninguna coincide.
  - CNMV: «No hay datos disponibles» en las seis búsquedas. El control
    «Capital» da 40 páginas.
  - Zefix y PolyReg: idénticos a ayer. Solo Switzerlend está afiliada a
    PolyReg.
- **Novedad menor, solo del expediente:** la API de ajustes del portal ya no
  trae el campo `identityVerification`, que ayer valía `false`. Los mínimos
  y los textos de recompra no cambian. No afecta a la tarjeta.
- **12 meses de Aktionariat:** hoy salen 23 compras al emisor, y ayer 24.
  Solo es porque la ventana de 12 meses se mueve un día y sale la compra del
  10/11/2025.

**Qué hay que re-fechar al 11/11:**

- **Aktionariat** (sigue en «principales»):
  - la métrica «Precio del emisor · 11/11/2026: 7,25 CHF por acción (fijo)»;
  - la métrica «Supervisor (11/11/2026)»;
  - el aviso «… 6,20 ZCHF frente a 7,25 CHF el 11/11/2026»;
  - el mínimo y la salida de la tarjeta: «(7,25 ZCHF el 11/11)» y «(mejor
    compra 6,10 el 11/11)».
- **Boss Info** (sigue en «secundario»):
  - el mínimo: «… unos 17 ZCHF el 11/11»;
  - la métrica «Supervisor (11/11/2026)»;
  - el aviso «El precio del emisor está por encima de la mejor oferta de
    venta entre accionistas (venta más barata 8,40 ZCHF el 11/11/2026)»;
  - la referencia «Última operación · 11/11/2026: 8,40 ZCHF (1 acción,
    05/11/2026)».

  El resumen publicado sigue siendo cierto.
- **Switzerlend** (sigue en «secundario»):
  - el aviso de la recompra: «… el 11/11/2026 la recompra seguía
    desactivada…»;
  - el aviso de vendedores: «… 67,00 ZCHF el 11/11/2026»;
  - el mínimo: «1 acción (68,01 CHF el 11/11)»;
  - la métrica «Supervisor (11/11/2026)».

## Observación para el coordinador

En la lectura pública de las 09:01 UTC, 13 de mis 14 fichas siguen como
`no_verificable`: las 11 de Brickwise, Boss Info y Switzerlend. Solo
Aktionariat sale como `actual`. Por eso el visitante no ve sus mínimos.

Las cifras de hoy sí se han podido comprobar en su fuente. El estado
editorial lo decide el coordinador.

## Bloqueos y límites

- **FMA:** su buscador web da 403 (Cloudflare) a curl. Lo leí con Playwright,
  sin sesión, y obtuve los resultados.
- **Firmenbuch austriaco:** es de pago. Los números FN vienen de los
  documentos y de la API.
- **Órdenes de Brickwise:**
  - no se sabe si se puede comprar solo una parte de una orden;
  - no se sabe si las órdenes que desaparecen se ejecutaron o se retiraron.
- **`sharePrice` de Brickwise:** no hay metodología publicada.
- **Portales suizos:**
  - no se probaron el registro ni el KYC;
  - nadie publica cuánto queda del tope de 100.000 € para el EEE;
  - sin la API (`identityVerification`) no se puede saber si hoy se exige
    verificación de identidad.
- **Contratos sin código verificado:** los del mercado de DAKS y de BOSS
  siguen sin código verificado (Sourcify da 404). La comisión se interpreta
  con el contrato verificado de LENDS.
- **Lo que no toqué:** no escribí nada fuera de `grupos/reventa/` y de mis 14
  expedientes. No hay candidatas nuevas en este grupo.
