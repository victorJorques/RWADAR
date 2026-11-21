# Qué cambia en la entrega 2026-11-20.2 (frente a la 2026-11-20)

Generado por el motor (`motor.mjs revisar 2026-11-20.2`) a partir de decisiones.json, el contraste y los dos SQL. Es el punto de partida de la revisión: cada revisor sigue haciendo sus propias pruebas.

- SQL de hoy: `aplicar-y-aprobar.sql` SHA-256 `622881c1f1c00e48f657ec8b1240fcd408f79dc7a89df558531a3048e47387cb`, revisión `94f7fd5d-f6e5-c28e-1c31-a6ea5a5f38d7`.
- Parte de la publicada `eca89db7-aac5-35fa-f792-5bffbe8795e2` (huella `eca89db7aac535fa…`); último día vigente 27/11/2026.
- Inventario: las mismas filas por tabla que ayer (35 en alerta_fuentes, 25 en alertas, 69 en fuentes, 22 en ofertas, 107 en plataforma_fuentes, 25 en plataformas, 1 en revisiones).
- Sentencias del SQL que cambian algo más que la revisión, la huella y la fecha del día: **20** de 288.

## Cambios por ficha (73 en 18 fichas)

### spiko-letras-del-tesoro-euro

- tarjeta (fecha del dato): «Acceso desde España: Disponible para residentes en España tras el alta y la verificación (KYC) del proveedor. · dato del 2026-11-06» → «Acceso desde España: Disponible para residentes en España tras el alta y la verificación (KYC) del proveedor. · dato del 2026-11-13»
- referencia de la ficha: «Precio · consulta 01/11/2026: Latest NAV 1.0620 · 2026-11-01 ; amount 1.062032 EUR, updatedAt 2026-10-30T16:02:10Z» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: 🇪🇸 Spain ✅ (Smart Cash) ✅ (T-Bills Euro) ✅ (T-Bills Dollar) ❌ (T-Bills Pound) · Last updated: October 23, 2026» → (se quita)

### spiko-letras-del-tesoro-dolar

- tarjeta (fecha del dato): «Acceso desde España: Disponible para residentes en España tras el alta y la verificación (KYC) del proveedor. · dato del 2026-11-06» → «Acceso desde España: Disponible para residentes en España tras el alta y la verificación (KYC) del proveedor. · dato del 2026-11-13»
- referencia de la ficha: «Precio · consulta 01/11/2026: amount 1.101207 USD · day 2026-10-30» → (se quita)
- referencia de la ficha: «Acceso desde España · consulta 01/11/2026: 🇪🇸 Spain ✅ ✅ ✅ ❌ (columna T-Bills Dollar ✅)» → (se quita)

### spiko-smart-cash-euro

- fuente de la ficha: «https://geco.amf-france.org/produit-d-epargne/c124199» → (se quita)
- tarjeta (fecha del dato): «Acceso desde España: Disponible para particulares residentes en España según Spiko, tras el alta y la verificación de identidad (KYC) · dato del 2026-11-06» → «Acceso desde España: Disponible para particulares residentes en España según Spiko, tras el alta y la verificación de identidad (KYC) · dato del 2026-11-13»

### mtbill

- fuente de la ficha: «https://midas.app/assets/main-DOxid0Zj.js» → (se quita)

### vivienda-pluddemanngasse-101-graz

- referencia de la ficha: «Precio desde anunciado: 84 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 80,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":333» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":76» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 21 órdenes de venta abiertas, 333 participaciones, la más barata a 80 €; 3 órdenes de compra, la mejor a 20 €» → (se quita)

### vivienda-sonnleithnergasse-2-viena

- referencia de la ficha: «Precio desde anunciado: 75 EUR» → (se quita)
- referencia de la ficha: «Precio más bajo en mercado secundario (API) · 22/10/2026: 75,00 EUR» → (se quita)
- referencia de la ficha: «Participaciones disponibles en emisión (API) · 22/10/2026: 0 de 2.350» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":96» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":80» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 38 órdenes de venta abiertas, 96 participaciones, la más barata a 75 €; 10 órdenes de compra, la mejor a 69 €» → (se quita)

### local-de-estanco-klagenfurt

- referencia de la ficha: «Precio desde anunciado: 95 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 95,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":301» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":95» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 46 órdenes de venta abiertas, 301 participaciones, la más barata a 95 €; 4 órdenes de compra, la mejor a 88 €» → (se quita)

### vivienda-stallhofstra-e-28-gratwein

- referencia de la ficha: «Precio desde anunciado: 65 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 69,96 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":309» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":69.96» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 83 órdenes de venta abiertas, 309 participaciones, la más barata a 69.9 €; 12 órdenes de compra, la mejor a 30 €» → (se quita)

### vivienda-schwarzer-weg-18-graz

- referencia de la ficha: «Precio desde anunciado: 70 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 70,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":274» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":65» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 73 órdenes de venta abiertas, 274 participaciones, la más barata a 69.9 €; 8 órdenes de compra, la mejor a 60 €» → (se quita)

### drautalresidenz-paternion

- referencia de la ficha: «Precio desde anunciado: 55 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 70,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":150» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":67.8» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 32 órdenes de venta abiertas, 150 participaciones, la más barata a 70 €; 9 órdenes de compra, la mejor a 54 €» → (se quita)

### randhartingergasse-9-viena

- referencia de la ficha: «Precio desde anunciado: 60 EUR» → (se quita)
- referencia de la ficha: «Precio más bajo en mercado secundario (API) · 22/10/2026: 75,00 EUR» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":75» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 30 órdenes de venta abiertas, 183 participaciones, la más barata a 78 €; 8 órdenes de compra, la mejor a 40.5 €» → (se quita)

### apartamento-vacacional-hinterstoder-50

- referencia de la ficha: «Precio desde anunciado: 75 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 72,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":253» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":85» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 36 órdenes de venta abiertas, 253 participaciones, la más barata a 72 €; 7 órdenes de compra, la mejor a 65 €» → (se quita)

### vivienda-pottendorfer-stra-e-62-wr-neustadt

- referencia de la ficha: «Precio desde anunciado: 80 EUR» → (se quita)
- referencia de la ficha: «Precio más bajo en mercado secundario (API) · 22/10/2026: 80,00 EUR» → (se quita)
- referencia de la ficha: «Participaciones disponibles en emisión (API) · 22/10/2026: 0 de 1.410» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":106» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":72» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 19 órdenes de venta abiertas, 106 participaciones, la más barata a 80 €; 15 órdenes de compra, la mejor a 63 €» → (se quita)

### fotovoltaica-greenpoint

- referencia de la ficha: «Precio desde anunciado: 100 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 100,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":351» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":95» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 16 órdenes de venta abiertas, 351 participaciones, la más barata a 100 €; 10 órdenes de compra, la mejor a 90 €» → (se quita)

### fotovoltaica-cohotel

- referencia de la ficha: «Precio desde anunciado: 110 EUR» → (se quita)
- referencia de la ficha: «Precio por participación · 22/10/2026: desde 110,00 EUR» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"availableBricksSecondary":65» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: "sharePrice":120» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 5 órdenes de venta abiertas, 65 participaciones, la más barata a 110 €; 5 órdenes de compra, la mejor a 3 €» → (se quita)

### aktionariat

- referencia de la ficha: «Precio · consulta 01/11/2026: Price per DAKS 7.25 CHF» → (se quita)
- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Direct Investment – Invest in Aktionariat AG by buying tokenized shares directly from the issuer at a fixed price.» → (se quita)

### boss-info

- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Buy BOSS at 8.502 CHF · bank transfer or crypto» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: Price per BOSS 8.5 CHF» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: 28 Sep 2026 / 11:32 Secondary Trade 6.70 ZCHF 474 BOSS» → (se quita)
- referencia de la ficha: «Último cruce documentado: 8,44 CHF» → (se quita)

### switzerlend

- referencia de la ficha: «Estado de la oferta · consulta 01/11/2026: Buy LENDS at 68.0105 CHF · bank transfer or crypto» → (se quita)
- referencia de la ficha: «Precio · consulta 01/11/2026: Price per LENDS 68.01 CHF» → (se quita)

## Tarjetas que cambian (0)


## Sentencias del SQL que cambian (normalizado)

### bloque aprobar

- …= 'Entrega < «FECHA» → «ETIQUETA»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-euro' 'https://www.spiko.io/es/spiko-letras-del-tesoro-euro'

- …{"etiqueta":" «Precio · consulta 01/11/2026","valor":"Latest NAV 1.0620 · 2026-11-01 ; amount 1.062032 EUR, updatedAt 2026-10-30T16:02:10Z","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://data.spiko.io/eutbl/","alcance":"El 01/11 es domingo y festivo (nonOperatingDays de la API): la VL del …» → «»
- …Acceso desde España  «· consulta 01/11/2026","valor":"🇪🇸 Spain ✅ » → «»
- … Spain ✅ ( «Smart Cash) ✅ (T-Bills Euro) ✅ (T-Bills Dollar) ❌ (T-Bills Pound) · Last updated: October 23, 2026","fechaDato":"2026-10-23","fechaConsulta":"2026-11-01","fuente":"https://docs.spiko.io/documentation/product_overview/fund_availability","alcance":"Coherente con el registro CNMV n.º 2380 de SPIKO SICA…» → «»
- … Alta de particulares « con KYC (documento de identidad, biometría con Onfido, test de conveniencia, posible prueba de domicilio» → «»
- …prueba de domicilio) «. Excluidas las «U.S. Persons». No se ha hecho onboarding. Localizador: docs.spiko.io «Fund Availability», tabla por país."},{"etiqueta":"Acceso desde España (particulares) » → « »
- …:"2026-11- «06» → «13»

### rwadar_catalogo.ofertas 'spiko-letras-del-tesoro-dolar' 'https://www.spiko.io/es/spiko-letras-del-tesoro-dollar'

- …{"etiqueta":" «Precio · consulta 01/11/2026","valor":"amount 1.101207 USD · day 2026-10-30","fechaDato":"2026-10-30","fechaConsulta":"2026-11-01","fuente":"https://data.spiko.io/ustbl/","alcance":"GECO muestra 0,98304 € al 30/10/2026: es esta misma clase en dólares expresada en euros, no la clase EUR no cubierta (…» → «»
- …{"etiqueta":" «Acceso desde España · consulta 01/11/2026","valor":"🇪🇸 Spain ✅ ✅ ✅ ❌ (columna T-Bills Dollar ✅)","fechaDato":"2026-10-23","fechaConsulta":"2026-11-01","fuente":"https://docs.spiko.io/documentation/product_overview/fund_availability","alcance":"Coherente con CNMV n.º 2380 (SICAV) y con la lista de …» → «»
- …:"2026-11- «06» → «13»

### rwadar_catalogo.ofertas 'spiko-smart-cash-euro' 'https://www.spiko.io/es/spiko-euro'

- …17&lang=es" «,"https://geco.amf-france.org/produit-d-epargne/c124199"» → «»
- …:"2026-11- «06» → «13»
- … de Spiko ( «06» → «13»
- …06/11/2026) «» → «: España marcada en la columna Smart Cash, que cubre Spiko Euro»
- … los fondos extranjeros «: » → « y la AMF ya »
- … extranjeros: no  «consta en » → «muestra la ficha del fondo: »
- …consta en ningún  «supervisor» → «registro público confirma que este fondo esté dado de alta para venderse en España»

### rwadar_catalogo.ofertas 'mtbill' 'https://midas.app/mtbill'

- …//midas.app/ «assets/main-DOxid0Zj.js» → «»
- …,"https:// «midas.app/","https://» → «»

### rwadar_catalogo.ofertas 'aktionariat' 'https://shares.aktionariat.com/invest'

- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"Direct Investment – Invest in Aktionariat AG by buying tokenized shares directly from the issuer at a fixed price.","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://shares.aktionariat.com/","alcance":"Contrato de venta 0x2f2c…» → «»

### rwadar_catalogo.ofertas 'boss-info' 'https://shares.bossinfo.com/'

- …{"etiqueta":" «Último cruce documentado","valor":"8,44 CHF","fechaDato":"2026-08-29","fechaConsulta":"2026-09-27","fuente":"https://shares.bossinfo.com/","alcance":"La revisión del 27/09/2026 seguía mostrando esta operación de agosto. Referencia histórica, no cotización ejecutable ni prueba de liquidez."},{"etique…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"Buy BOSS at 8.502 CHF · bank transfer or crypto","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://shares.bossinfo.com/trade","alcance":"No hay ninguna compra al emisor entre las 40 operaciones más recientes (todas secundarias…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'switzerlend' 'https://shares.lend.ch/'

- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"Buy LENDS at 68.0105 CHF · bank transfer or crypto","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://shares.lend.ch/trade","alcance":"Localizador: /trade DIRECT FROM ISSUER; isPrimaryMarketEnabled=true; on-chain settings()=5 …» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'vivienda-pluddemanngasse-101-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"84 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 80,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":333","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2rah5","alcance":"La emisión primaria terminó (campaña 05.11.2021…» → «»
- …,"valor":" «\"sharePrice\":76","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2rah5","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2RAH5…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'vivienda-sonnleithnergasse-2-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"75 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Participaciones disponibles en emisión (API) · 22/10/2026","valor":"0 de 2.350","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibili…» → «»
- …etiqueta":"Precio  «más bajo en mercado secundario (API) » → «»
- …(API) ·  «22/10/2026","valor":"75,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura. Leído el 22/10/…» → «»
- …,"valor":" «\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":96","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2t4d7","alcance":"La emisión primaria terminó (campaña 30.11.2021); solo hay órdenes de reventa entre inversores. Una …» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'local-de-estanco-klagenfurt' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"95 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 95,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":301","fechaDato":"2026-10-27","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2u5v3","alcance":"La emisión primaria terminó (campaña 15/01/2022…» → «»
- …,"valor":" «\"sharePrice\":95","fechaDato":"2026-10-27","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2u5v3","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2U5V3…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'vivienda-stallhofstra-e-28-gratwein' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"65 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 69,96 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":309","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2wcd0","alcance":"La emisión primaria terminó (campaña 15/05/2022…» → «»
- …,"valor":" «\"sharePrice\":69.96","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2wcd0","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2W…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'vivienda-schwarzer-weg-18-graz' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"70 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 70,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":274","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2wce8","alcance":"La emisión primaria terminó (campaña 30/06/2022…» → «»
- …,"valor":" «\"sharePrice\":65","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2wce8","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2WCE8…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'drautalresidenz-paternion' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"55 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 70,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":150","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2ypq0","alcance":"La emisión primaria terminó (campaña 0/.9/.022)…» → «»
- …,"valor":" «\"sharePrice\":67.8","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2ypq0","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2YP…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'randhartingergasse-9-viena' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"60 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …etiqueta":"Precio  «más bajo en mercado secundario (API) » → «»
- …(API) ·  «22/10/2026","valor":"75,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura. Leído el 22/10/…» → «»
- …,"valor":" «\"sharePrice\":75","fechaDato":"2026-10-25","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a2zt84","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A2ZT84…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'apartamento-vacacional-hinterstoder-50' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"75 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 72,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni ren…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":253","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a31kp7","alcance":"La emisión primaria terminó (campaña 21.12.2022…» → «»
- …,"valor":" «\"sharePrice\":85","fechaDato":"2026-10-31","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a31kp7","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A31KP7…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'vivienda-pottendorfer-stra-e-62-wr-neustadt' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"80 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Locali…» → «»
- …{"etiqueta":" «Participaciones disponibles en emisión (API) · 22/10/2026","valor":"0 de 1.410","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibili…» → «»
- …etiqueta":"Precio  «más bajo en mercado secundario (API) » → «»
- …(API) ·  «22/10/2026","valor":"80,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni rentabilidad futura. Leído el 22/10/…» → «»
- …,"valor":" «\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":106","fechaDato":"2026-10-15","fechaConsulta":"2026-11-01","fuente":"https://www.brickwise.at/assets/at0000a324b4","alcance":"La emisión primaria terminó (campaña 1/.3/.023); solo hay órdenes de reventa entre inversores. Una …» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'fotovoltaica-greenpoint' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"100 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Local…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 100,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni re…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":351","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"La emisión primaria terminó (campaña 30.12.2023);…» → «»
- …,"valor":" «\"sharePrice\":95","fechaDato":"2026-11-01","fechaConsulta":"2026-11-01","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A38J32: …» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'fotovoltaica-cohotel' 'https://app.brickwise.at/desktopWeb/marketplace'

- …{"etiqueta":" «Precio desde anunciado","valor":"110 EUR","fechaDato":null,"fechaConsulta":"2026-09-27","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Precio desde anunciado en la tarjeta individual. La tarjeta no fecha el cálculo; no acredita precio ejecutable ni disponibilidad actual. Local…» → «»
- …{"etiqueta":" «Precio por participación · 22/10/2026","valor":"desde 110,00 EUR","fechaDato":null,"fechaConsulta":"2026-10-22","fuente":"https://app.brickwise.at/desktopWeb/marketplace","alcance":"Visto en la fuente oficial el 22/10/2026. Cifra indicativa y variable; no garantiza disponibilidad, elegibilidad ni re…» → «»
- …{"etiqueta":" «Estado de la oferta · consulta 01/11/2026","valor":"\"stage\":\"secondary\",\"availableBricks\":0,\"availableBricksSecondary\":65","fechaDato":"2026-10-08","fechaConsulta":"2026-11-01","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"La emisión primaria terminó (campaña 4/.1/.024); s…» → «»
- …,"valor":" «\"sharePrice\":120","fechaDato":"2026-10-08","fechaConsulta":"2026-11-01","fuente":"https://api.app.brickwise.at/api/v2/assets","alcance":"Campo sin metodología publicada en las fuentes leídas (probablemente última referencia de mercado); no es precio ejecutable. Localizador: Objeto id=AT0000A38J40:…» → «»
- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

### rwadar_catalogo.ofertas 'hausera-proximas-ofertas' 'https://hausera.io/oportunidades/'

- …,"alcance":" «Redacción en castellano del dato comprobado » → «Comprobado de nuevo »

## Lo que no se aplicó tal cual (0)

