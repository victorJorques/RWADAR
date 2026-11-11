# Revisión independiente · grupo «reventa» · 11/11/2026

Revisé los 14 expedientes del grupo (11 de Brickwise y 3 de portales
Aktionariat) entre las **09:37 y las 09:51 UTC** del 11/11/2026. No preparé
estos expedientes. Abrí yo mismo cada fuente primaria, sin iniciar sesión, sin
KYC y sin enviar nada. No edité ningún expediente ni archivo del grupo.

Hoy todas las fuentes respondieron. Solo el buscador de la FMA da 403 a curl,
igual que al investigador, y lo leí con el navegador (Playwright), sin sesión.

Mis copias están en `fuentes/reventa/`, con hora, código HTTP y SHA-256 en
`fuentes/reventa/inventario-revisor.json` (64 consultas). Lo crudo (carteras,
HTML con correos o nombres) está en `fuentes/reventa/crudo/`.

## Veredicto

**Aprobado con cambios.**

- Las 11 fichas de Brickwise quedan **confirmadas**, también los dos cambios
  críticos del mínimo.
- Aktionariat, Boss Info y Switzerlend quedan **confirmadas con cambios**. Sus
  cifras son ciertas, pero los textos de la tarjeta del expediente no son los
  que están publicados. El expediente los presenta como un simple cambio de
  fecha y no lo son.
- **Copias del grupo:** hay 11 PDF fuera de `crudo/` con nombres de personas
  físicas. Esto no cambia ninguna tarjeta.

| Ficha | Propuesta | Mi veredicto |
|---|---|---|
| vivienda-schwarzer-weg-18-graz | mínimo 65 € → 69,90 € | confirmado |
| vivienda-pottendorfer-stra-e-62-wr-neustadt | mínimo 74 € → 73 € | confirmado |
| randhartingergasse-9-viena | solo fecha; mejor compra 46 € → 56 € | confirmado |
| apartamento-vacacional-hinterstoder-50 | solo fecha | confirmado |
| drautalresidenz-paternion | solo fecha | confirmado |
| fotovoltaica-cohotel | solo fecha | confirmado |
| fotovoltaica-greenpoint | solo fecha | confirmado |
| local-de-estanco-klagenfurt | solo fecha | confirmado |
| vivienda-pluddemanngasse-101-graz | solo fecha | confirmado |
| vivienda-sonnleithnergasse-2-viena | solo fecha | confirmado |
| vivienda-stallhofstra-e-28-gratwein | solo fecha | confirmado |
| aktionariat | solo fechas | confirmado con cambios (C1) |
| boss-info | solo fechas | confirmado con cambios (C2) |
| switzerlend | solo fechas | confirmado con cambios (C3) |

No hay `admitir_propuesta` ni `retirar_propuesta` en este grupo.

## 1. Brickwise: lo que comprobé

### Libro de órdenes

Fuentes:

- API pública `https://api.app.brickwise.at/api/v1/assets` y `/api/v2/assets`
  (09:38:12Z, segunda lectura a las 09:50:05Z con el mismo resultado);
- mercado de la app `https://app.brickwise.at/desktopWeb/marketplace`
  (09:39:13Z, con captura).

Mis cifras coinciden con las del investigador en las 11 fichas. El
«Preis pro Anteil ab» de la app coincide con la venta más barata de la API y
con `lowestOfferPrice` de la v2.

| Ficha (ISIN) | Venta más barata | En venta | Mejor compra | App |
|---|---|---|---|---|
| Schwarzer Weg 18 (AT0000A2WCE8) | **69,90 €** × 1 (orden del 27/10) | 299 | **60 €** × 1 (10/11) | «ab € 69,90» |
| Pottendorfer Str. 62 (AT0000A324B4) | **73 €** × 1 (orden del 11/11, 07:56Z) | 107 | 19 € × 3 | «ab € 73,00» |
| Randhartingergasse 9 (AT0000A2ZT84) | 78 € × 21 (2 órdenes) | 189 | **56 €** × 1 (10/11) | «ab € 78,00» |
| Hinterstoder 50 (AT0000A31KP7) | 75 € × 5 | 265 | 20 € × 4 (2 órdenes) | «ab € 75,00» |
| Drautalresidenz (AT0000A2YPQ0) | 70 € × 3 | 150 | 60 € × 1 | «ab € 70,00» |
| Cohotel (AT0000A38J40) | 110 € × 35 (2 órdenes) | 65 | 3 € × 1 | «ab € 110,00» |
| GreenPoint (AT0000A38J32) | 100 € × 5 | 351 | 84 € × 1 | «ab € 100,00» |
| Estanco Klagenfurt (AT0000A2U5V3) | 95 € × 16 (3 órdenes) | 302 | 15 € × 1 | «ab € 95,00» |
| Plüddemanngasse 101 (AT0000A2RAH5) | 75 € × 2 | 335 | 20 € × 1 | «ab € 75,00» |
| Sonnleithnergasse 2 (AT0000A2T4D7) | 75 € × 11 | 97 | 65 € × 1 | «ab € 75,00» |
| Stallhofstraße 28 (AT0000A2WCD0) | 68,80 € × 1 | 317 | 30 € × 1 | «ab € 68,80» |

Notas:

- **Schwarzer Weg:** la venta de 65 € del 09/11 ya no está; la más barata es
  la de 69,90 €, del 27/10. **Pottendorfer:** la de 74 € ya no está; hay una
  nueva de hoy a 73 €. Confirmo los dos cambios críticos.
- Comparé mi copia de la v1 con la del investigador (09:16Z) orden a orden. En
  las 11 fichas son iguales. Lo único distinto es Drautalresidenz: `likes`
  292 → 291 y su `updatedAt`, a las 09:35:36Z. Ninguna orden cambia.
- Las 11 siguen con `stage: "secondary"`. La única con `stage: "primary"` es
  BILLA (AT0000A3SE89), con 6.322 disponibles. No hay emisiones nuevas.
- Randhartingergasse sigue con `availableBricks: 374`. Es la anomalía que el
  expediente ya anota.

### Fichas de cada activo y avisos con fecha

Fuente: `https://bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>`
(09:39:24–09:39:28Z).

- Las 11 respuestas son **idénticas byte a byte** a las del investigador.
- Frente a la copia del 10/11 (`2026-11-10-v2/grupos/brickwise/fuentes/crudo/`):
  - Schwarzer Weg: solo cambian `sharePrice` (60,00 → 65,00), `rentalReturn`
    (4,04 → 3,73) y `updatedAt`;
  - Pottendorfer: solo cambia `updatedAt`;
  - Drautal y Randhartinger: iguales.

  Todo coincide con el expediente.
- Los avisos con fecha siguen vigentes:
  - **Schwarzer Weg:** «Das Mietverhältnis endet am 30.08.2023».
  - **Pottendorfer:** «Das Mietverhältnis endet am 30.11.2025» y
    «Grundbücherliche Besicherung noch ausstehend.».
  - **Randhartinger:** «Das Mietverhältnis wurde vom Mieter gekündigt und
    endet am 28.02.2026. Es wird ein Nachmieter gesucht.».
  - **Plüddemanngasse:** «Es endet somit am 31.07.2024».
  - **Sonnleithnergasse:** `contractEndDate` 2026-11-29 frente a «Der
    aktuelle Mietvertrag wurde zum 30. September 2023 gekündigt».
  - **Stallhofstraße:** `contractEndDate` 2022-02-01T23:00Z (02/02/2022 en
    Austria) frente a «Das Mietverhältnis endet am 31.03.2027».

### Documentos

- Descargué los **50 PDF distintos** que citan los 14 expedientes entre las
  09:40:15 y las 09:40:35Z:
  - 34 de `cdn.brickwise.at`;
  - 15 de `storage.googleapis.com`;
  - 1 de `bossinfo.com`.
- Los 50 tienen el mismo SHA-256 que el expediente (tabla en
  `fuentes/reventa/pdf-hashes-revisor-2026-11-11.tsv`).
- El investigador habla de «55 PDF», contando las copias repetidas por
  emisión. La diferencia de recuento no cambia nada.

### Acceso, comisión y entidad

Las cuatro páginas se leyeron con el navegador (09:40:45–09:41:07Z). En las
cuatro, el texto es igual al de la copia del investigador, sin contar el aviso
de cookies.

- **Acceso desde España**
  (`https://www.brickwise.at/support/kann-ich-einen-account-von-jedem-land-aus-eroffnen`):
  «Jede Person mit einem Wohnsitz in einem der EWR-Mitgliedstaaten kann einen
  Account eröffnen.» El texto «Sin confirmar» de la tarjeta sigue siendo
  correcto.
- **Comisión de reventa** (`…/was-kostet-der-handel-am-marktplatz`):
  «Vermittlungsgebühr von 1,5 % der jeweiligen Transaktionshöhe».
- **Quién vende** (`https://www.brickwise.at/imprint`): «vertraglich gebundener
  Vermittler im Sinne von § 3 (2) WpIG … der Effecta GmbH, Florstadt».

### Registros y advertencias

**BaFin** (09:42:11Z):

- Effecta GmbH (`institutDetails.do?…institutId=133261`), «Stand der Daten:
  10.11.2026», con «Anlagevermittlung (§ 2 Abs. 2 Nr. 3 WpIG)».
- En el registro de agentes vinculados (búsqueda «Brickwise»), Brickwise
  Investment GmbH figura con el nº 80174029 de Effecta GmbH. Tätig ab
  04.08.2021; «Tätig bis» vacío, así que sigue activa.

**CNMV**:

- Effecta GmbH, nº 5003, «Empresas de Servicios de Inversión del Espacio
  Económico Europeo en Libre Prestación», registrada el 11/11/2020, solo para
  «Recepción y transmisión de órdenes» (09:41:46Z).
- Pestaña «Agentes» (vista=8): «No se han encontrado datos disponibles»
  (09:41:59Z).
- Advertencias (`/portal/ResultadoBusqueda?tipo=1&nombre=…`, 09:41:17–27Z):
  ningún resultado para Brickwise, Effecta y Brick Qogir.
- El buscador funciona: con «Trading» (09:41:38Z) devuelve advertencias, la
  última del 10/11/2026.

**FMA** (`https://www.fma.gv.at/en/?s=…`, con el navegador, 09:42:28–45Z):
«0 Search results for "brickwise"» y «0 Search results for "effecta"».

## 2. Aktionariat, Boss Info y Switzerlend: lo que comprobé

### API de los portales (09:43:33–09:44:04Z)

- `brokerbotsettings` y `secondarymarketsettings` de los tres: **mismo
  SHA-256** que las copias del investigador.
  - Mínimo por transferencia: Aktionariat 500, Boss 100 y LENDS 0.
  - Mínimo en cripto: 0, 9 y 0.
  - Comisión: `sellerFeeRate: 0.0190` y `buyerFeeRate: 0`.
  - El campo `identityVerification` ya no aparece, como dice el expediente.
- `getOrderBook` (POST `{"company":77|1664|40880}`): el libro es **idéntico**.
  Solo cambia `whenUpdated`.
  - Aktionariat: compra 6,10 × 10; venta 6,20 × 356.
  - Boss: compra 7,30 × 1.000; venta 8,40 × 103.
  - LENDS: compra 59,00 × 4; venta 67,00 × 15.
- `getTrades`: **igual byte a byte** que la copia del investigador. No hay
  operaciones nuevas.
  - Aktionariat: última compra al emisor el 31/10/2026, 1 acción a 7,25.
  - Boss: última operación el 05/11/2026, 1 acción a 8,40 ZCHF; última compra
    al emisor el 29/06/2026.
  - LENDS: última compra al emisor el 07/10/2026.

### En cadena (Ethereum, solo lectura, bloque 26390864, 09:44:32Z)

| | `settings()` | `getPrice()` | ZCHF en el brokerbot |
|---|---|---|---|
| Aktionariat | 1 | 7,25 | 928 |
| Boss Info | 1 | 8,50197 | 2.491,46 |
| Switzerlend | 5 | 68,0105 | **0,0318** |

Todo es igual a la lectura del investigador. Confirma el aviso de Switzerlend:
«el 11/11/2026 la recompra seguía desactivada y casi sin fondos (0,03 ZCHF)».

### Portales con el navegador (09:44:42–09:46:32Z)

- **Aktionariat:**
  - `/invest`: «Price per DAKS 7.25 CHF».
  - `/trade`: «Bid/Ask 6.10 / 6.20» y «Buy DAKS at 7.25 CHF · bank transfer or
    crypto».
- **Boss Info** (`/trade`): «Bid/Ask 7.30 / 8.40» y «Buy BOSS at 8.502 CHF».
- **Switzerlend** (`/trade`): «Bid/Ask 59.00 / 67.00» y «Buy LENDS at 68.0105
  CHF».
- **Condiciones del portal** (`https://shares.bossinfo.com/investor-page-terms`):
  - «Version 1.0 • October 30, 2026»;
  - «9.1 Offer only valid for persons in Switzerland and the EEA … The offer
    for persons from the EEA is limited to a total of €100,000.».
- **Web de LEND** (`https://www.lend.ch/en/investor-relations`, 09:48:16Z):
  «You can sell back to the brokerbot when it holds sufficient liquidity».
  Sigue en conflicto con el contrato, como dice el aviso.
- **FAQ de Boss Info** (09:48:21Z): sigue hablando de «xCHF» y no menciona
  ZCHF. El aviso sigue vigente.
- **Aviso legal de Aktionariat** (`https://www.aktionariat.com/disclaimer`,
  09:46:17Z): igual byte a byte.

### Registros (09:46:40–09:50:14Z)

- **FINMA, registro de autorizados:** 0 resultados para «Aktionariat», «Boss
  Info» y «Switzerlend». El control con «Sygnum» da 1 resultado.
- **FINMA, lista de advertencias:** 2.404 entradas. Ninguna contiene
  Aktionariat, Boss Info, Switzerlend, Brickwise ni Effecta.
- **CNMV, advertencias:** ningún resultado para Aktionariat, Boss Info y
  Switzerlend.
- **PolyReg:** «Switzerlend AG» → `"result": "true"`, igual que ayer.
- **Zefix (Switzerlend):** igual byte a byte.

**Conclusión:** en los tres no cambia nada de fondo. Las métricas y los
avisos con fecha se pueden pasar al 11/11 con estas fuentes.

## 3. Los textos de la tarjeta (`resumenTarjeta`)

- **Los 42 textos (14 fichas × 3):** todos tienen 120 caracteres o menos (el más largo, 119).
  Están en castellano llano, sin citas literales en alemán ni en inglés.
- **Mínimo en reventa:** sigue la norma: «Desde X € la participación en
  reventa (11/11)». Nunca dice «por participación» ni lo presenta como precio
  de emisión.
- **Brickwise, mínimo:**
  - **Schwarzer Weg:** «Desde 69,90 € la participación en reventa (11/11)»
    (49 caracteres). Respaldado por la API y la app.
  - **Pottendorfer:** «Desde 73 € la participación en reventa (11/11)» (46
    caracteres). Respaldado por la API y la app.
  - **Las otras 9:** mismo precio, solo cambia la fecha. Respaldado.
- **Brickwise, acceso y salida:** iguales a lo publicado. Respaldados.
- **Aktionariat, Boss Info y Switzerlend:** los textos del expediente **no
  son los publicados**. Son los que proponía el expediente del 10/11, que el
  coordinador no adoptó: dejó los publicados (`2026-11-10-v2/DECISIONES-COORDINADOR.md`
  y `documentacion-ofertas.json`). Hoy el expediente presenta en
  `cambiosRespectoPublicado` un «antes» que no es el publicado y dice que
  solo cambian fechas. Ver C1 a C3.

| Ficha | Campo | Publicado (10/11) | Propuesto hoy |
|---|---|---|---|
| aktionariat | mínimo | «500 CHF por transferencia bancaria» | «500 CHF por transferencia; en cripto, desde 1 acción (7,25 ZCHF el 11/11)» |
| aktionariat | acceso | «Disponible para residentes en Suiza y el Espacio Económico Europeo, con un tope total de 100.000 € para el EEE.» | «Sí: la venta del emisor admite residentes en Suiza y el EEE, con un tope total de 100.000 € para el EEE» |
| aktionariat | salida | «Venta solo a otros accionistas; el emisor no recompra» | «El emisor no recompra; vendes a otros accionistas en ZCHF, con un 1,9 % de comisión (mejor compra 6,10 el 11/11)» |
| boss-info | acceso | «… del portal: admite Suiza y EEE, con tope total…» | «… del portal: Suiza y EEE, con tope total…» (quita «admite») |
| boss-info | salida | «El emisor no recompra ahora; vendes a otros accionistas en ZCHF si hay comprador» | «El emisor no recompra; vendes a otros accionistas en ZCHF, con un 1,9 % de comisión (mejor compra 7,30 el 11/11)» |
| switzerlend | acceso | igual que Boss Info | igual que Boss Info (quita «admite») |
| switzerlend | salida | «… vendes a otros accionistas en ZCHF si hay comprador» | «… vendes a otros accionistas en ZCHF, con un 1,9 % de comisión» |

Las cifras de los textos propuestos son ciertas hoy (7,25; mejor compra 6,10 y
7,30; comisión 1,9 %). Lo que falla es el registro del cambio, no el dato.

## 4. Datos personales en las copias del grupo

- **Expedientes, resumen e inventario:** limpios. No hay nombres de personas
  físicas ni correos personales.
- **Copias de texto:** llevan «[persona física recortada]» donde hace falta.
  Yo recorté igual en mis copias de la FAQ y el imprint de Brickwise.
- **Copias en PDF:** hay **11 PDF fuera de `crudo/`** con nombres de personas
  físicas:
  - `fuentes/suiza/`: los acuerdos de registro de Aktionariat y Switzerlend y
    el reglamento de Boss Info. Llevan los nombres de los miembros del
    consejo que firman. Los otros dos acuerdos de tokens de Aktionariat y
    Switzerlend van en el mismo lote: la revisión del 10/11 ya encontró una
    línea con datos privados en la copia del acuerdo de tokens de
    Switzerlend.
  - `fuentes/brickwise/info-*.pdf` (6 archivos): cada uno tiene una línea
    «Geschäftsführung» con el nombre del gerente.

  El 10/11 la revisión ya pidió «No subir PDF ni nada de `crudo/`». Ver C4.
- **Mis copias:** dejé en `crudo/` la página de LEND, la respuesta de ajustes
  de Boss Info (lleva un correo personal) y las respuestas con carteras.

## 5. Bloqueos (los mismos que el investigador; ninguno nuevo)

- **FMA:** curl recibe 403 (Cloudflare). Leída con navegador sin sesión.
- **Firmenbuch austriaco:** es de pago. No lo consulté.
- **Brickwise:**
  - no se sabe si se puede comprar solo una parte de una orden;
  - no se sabe si las órdenes que desaparecen se vendieron o se retiraron;
  - `sharePrice` no tiene metodología publicada.
- **Portales suizos:**
  - no probé el registro ni el KYC;
  - nadie publica cuánto queda del tope de 100.000 € del EEE;
  - sin `identityVerification` no se sabe si hoy se exige verificar la
    identidad.
- **Mercados de DAKS y BOSS:** no los volví a mirar en Sourcify. El
  investigador da 404.

## 6. Correcciones obligatorias

- **C1 · aktionariat.** En `cambiosRespectoPublicado`, el «antes» de
  `resumenTarjeta` debe ser el texto publicado (tabla del punto 3). Los tres
  textos publicados no llevan fecha, así que no hay nada que re-fechar en
  ellos. El coordinador elige una de dos opciones:
  - **(a)** conservar los tres textos publicados. Lo recomiendo: es lo que
    decidió el 10/11.
  - **(b)** adoptar los nuevos, pero anotándolos como cambio de texto, no de
    fecha. Las cifras están respaldadas hoy: 7,25 en cadena y en `/invest`;
    6,10 × 10 en `getOrderBook`; 1,9 % en `secondarymarketsettings`.

  Lo demás se queda como propone el expediente: «Precio del emisor ·
  11/11/2026», «Supervisor (11/11/2026)» y el aviso «6,20 ZCHF frente a
  7,25 CHF el 11/11/2026».
- **C2 · boss-info.**
  - **Mínimo:** solo cambia la fecha, a «… (unos 17 ZCHF el 11/11)».
  - **Acceso:** conservar el texto publicado, con «admite».
  - **Salida:** conservar «El emisor no recompra ahora; vendes a otros
    accionistas en ZCHF si hay comprador», o anotar el texto nuevo como
    cambio de texto.
  - **«antes» de `cambiosRespectoPublicado`:** corregirlo.
  - **Sin cambios:** «Supervisor», el aviso de la venta más barata y la
    referencia «Última operación · 11/11/2026».
- **C3 · switzerlend.**
  - **Mínimo:** solo cambia la fecha, a «1 acción (68,01 CHF el 11/11)».
  - **Acceso y salida:** conservar los textos publicados («admite» y «si hay
    comprador»), o anotarlos como cambio de texto.
  - **Sin cambios:** los dos avisos con fecha y «Supervisor».
- **C4 · copias del grupo.**
  - **Qué mover:** `grupos/reventa/fuentes/suiza/*.pdf` (5) y
    `grupos/reventa/fuentes/brickwise/info-*.pdf` (6) van a
    `grupos/reventa/fuentes/crudo/`.
  - **Inventario:** actualizar `archivo` en `inventario-consultas.json`.
  - **Regla:** no subir a Git ningún PDF del grupo.

  No cambia ninguna tarjeta.

## 7. Notas para la entrega (no son del expediente)

- **`transparencia.json`:** su mínimo corto debe seguir a la tarjeta:
  - **Schwarzer Weg:** «Desde 65 € la participación (10/11)» → «Desde 69,90 €
    la participación (11/11)».
  - **Pottendorfer:** «Desde 74 € la participación (10/11)» → «Desde 73 € la
    participación (11/11)».
  - **Las otras 9 de Brickwise y Switzerlend:** solo cambia la fecha.
- **Ficha completa:** la venta más barata de Schwarzer Weg y de Pottendorfer
  es de **1 sola participación**. Si alguien la compra, el mínimo sube. Por
  eso conviene mantener el aviso «Los precios y el libro de órdenes cambian a
  diario». Ya está en las dos tarjetas.
