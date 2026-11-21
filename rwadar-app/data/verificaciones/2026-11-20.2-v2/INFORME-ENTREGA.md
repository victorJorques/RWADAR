# Entrega 2026-11-20.2 · informe del montador

Segunda entrega del 20/11/2026. Orden del responsable del proyecto (22:30 UTC):
«Lo viejo que no valga obviamente quítalo». Esta entrega **solo quita o
re-fecha lo viejo que ya no vale**; no cambia ninguna cifra, aviso, métrica ni
dato de tarjeta (salvo la fecha de «Acceso desde España» en las tres de Spiko,
que no cambia de valor). Fuera de la lista solo cambia el comienzo del alcance
de «Mínimo de inversión» en 14 fichas (las 11 de Brickwise, Boss Info,
Switzerlend y Hausera): «Redacción en castellano del dato comprobado en la
fuente el 20/11/2026.» pasa a «Comprobado de nuevo en la fuente el
20/11/2026.», como pone el motor a todo dato de tarjeta que se conserva; la
fecha y el resto de la nota no cambian. Tras la revisión única, el alcance de
«Acceso desde España» de Spiko Smart Cash dice «ningún registro público
confirma que este fondo esté dado de alta para venderse en España» en lugar de
«no consta en ningún supervisor» (revisión de cumplimiento, C1).

## Partida

- Publicada: entrega 2026-11-20, revisión `eca89db7-aac5-35fa-f792-5bffbe8795e2`,
  huella `eca89db7aac535faf7925bffbe8795e2edf8096c80af6789c7ab59b960a5af43`.
- Leída hoy como visitante (solo GET, clave publicable) de 22:32:56 a 22:32:59
  UTC en `lectura-publica/`: 25 plataformas, 22 ofertas (8/13/1), 5
  descartadas, todas de la eca89db7 y verificadas el 20/11. El motor exige que
  sea byte a byte la base local.
- Radar: el contraste de las 69 fuentes de hoy (16:57 UTC) y la lectura a mano
  de REGAFI, copiados de la entrega anterior; `cambios-radar.json` sin cambios
  (los de A23–A25 ya están en la publicada).
- Expedientes, auditoría y documentos de la publicada copiados tal cual
  (`expedientes/`, `auditoria/`, `partida-2026-11-20/`); no se ha editado
  ninguno.

## Lo nuevo

- Revisión `1d2cd6b1-0aca-2400-88c1-d8aa31d01f6a`
- Huella `1d2cd6b10aca240088c1d8aa31d01f6adf7f79e436a22600e43b3e6fa6141be6`
- `aplicar-y-aprobar.sql` SHA-256 `7b13a3d28ad47a3dac14d77dbbb1211f9d718ac8bf07548f1a05b42a9e9c8391`
- Vale hasta el 27/11/2026 (la guarda del SQL no deja aplicarlo después).

## Qué cambia (73 cambios en 18 fichas)

Lista cerrada de `DECISIONES-COORDINADOR.md` §2. Cada cambio lleva su prueba en
`decisiones.json`: la línea de DECISIONES, más el informe de auditoría del 20/11
o el dato de hoy en `lectura-publica/ofertas-v2.json` que la supera. Detalle
antes → ahora: `DIFF-ENTREGA.md`.

- mtbill · quita de las fuentes de la ficha https://midas.app/assets/main-DOxid0Zj.js — da 404 (DECISIONES del 20/11, A22) y ya no la cita nada.
- spiko-smart-cash-euro · quita de las fuentes de la ficha https://geco.amf-france.org/produit-d-epargne/c124199 — la AMF ya no publica esa ficha (DECISIONES del 20/11; auditoria/spiko.md: «published»:false) y ya no la cita nada.
- spiko-letras-del-tesoro-euro · «Acceso desde España» con fecha del dato 13/11/2026 (antes 06/11/2026), el valor no cambia (auditoria/spiko.md, hallazgo 3).
- spiko-letras-del-tesoro-dolar · «Acceso desde España» con fecha del dato 13/11/2026 (antes 06/11/2026), el valor no cambia (auditoria/spiko.md, hallazgo 3).
- spiko-smart-cash-euro · «Acceso desde España» con fecha del dato 13/11/2026 (antes 06/11/2026), el valor no cambia y el alcance dice «Tabla de disponibilidad de Spiko (13/11/2026)…» (texto de auditoria/spiko.md, hallazgo 3).
- vivienda-pluddemanngasse-101-graz · quita «Precio desde anunciado: 84 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-pluddemanngasse-101-graz · quita «Precio por participación · 22/10/2026: desde 80,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-pluddemanngasse-101-graz · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- vivienda-pluddemanngasse-101-graz · quita «Precio · consulta 01/11/2026: "sharePrice":76» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-pluddemanngasse-101-graz · quita «Precio · consulta 01/11/2026: 21 órdenes de venta abiertas, 333 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Precio desde anunciado: 75 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Precio más bajo en mercado secundario (API) · 22/10/2026: 75,00 EUR» — precio de reventa del 22/10; la ficha ya tiene la venta más barata del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Participaciones disponibles en emisión (API) · 22/10/2026: 0 de 2.350» — foto del 22/10 de la emisión, ya cerrada; la ficha ya tiene las participaciones en venta del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Precio · consulta 01/11/2026: "sharePrice":80» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-sonnleithnergasse-2-viena · quita «Precio · consulta 01/11/2026: 38 órdenes de venta abiertas, 96 participaciones, » — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- local-de-estanco-klagenfurt · quita «Precio desde anunciado: 95 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- local-de-estanco-klagenfurt · quita «Precio por participación · 22/10/2026: desde 95,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- local-de-estanco-klagenfurt · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- local-de-estanco-klagenfurt · quita «Precio · consulta 01/11/2026: "sharePrice":95» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- local-de-estanco-klagenfurt · quita «Precio · consulta 01/11/2026: 46 órdenes de venta abiertas, 301 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-stallhofstra-e-28-gratwein · quita «Precio desde anunciado: 65 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-stallhofstra-e-28-gratwein · quita «Precio por participación · 22/10/2026: desde 69,96 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-stallhofstra-e-28-gratwein · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- vivienda-stallhofstra-e-28-gratwein · quita «Precio · consulta 01/11/2026: "sharePrice":69.96» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-stallhofstra-e-28-gratwein · quita «Precio · consulta 01/11/2026: 83 órdenes de venta abiertas, 309 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-schwarzer-weg-18-graz · quita «Precio desde anunciado: 70 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-schwarzer-weg-18-graz · quita «Precio por participación · 22/10/2026: desde 70,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-schwarzer-weg-18-graz · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- vivienda-schwarzer-weg-18-graz · quita «Precio · consulta 01/11/2026: "sharePrice":65» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-schwarzer-weg-18-graz · quita «Precio · consulta 01/11/2026: 73 órdenes de venta abiertas, 274 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- drautalresidenz-paternion · quita «Precio desde anunciado: 55 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- drautalresidenz-paternion · quita «Precio por participación · 22/10/2026: desde 70,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- drautalresidenz-paternion · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- drautalresidenz-paternion · quita «Precio · consulta 01/11/2026: "sharePrice":67.8» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- drautalresidenz-paternion · quita «Precio · consulta 01/11/2026: 32 órdenes de venta abiertas, 150 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- randhartingergasse-9-viena · quita «Precio desde anunciado: 60 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- randhartingergasse-9-viena · quita «Precio más bajo en mercado secundario (API) · 22/10/2026: 75,00 EUR» — precio de reventa del 22/10; la ficha ya tiene la venta más barata del 20/11.
- randhartingergasse-9-viena · quita «Precio · consulta 01/11/2026: "sharePrice":75» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- randhartingergasse-9-viena · quita «Precio · consulta 01/11/2026: 30 órdenes de venta abiertas, 183 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- apartamento-vacacional-hinterstoder-50 · quita «Precio desde anunciado: 75 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- apartamento-vacacional-hinterstoder-50 · quita «Precio por participación · 22/10/2026: desde 72,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- apartamento-vacacional-hinterstoder-50 · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- apartamento-vacacional-hinterstoder-50 · quita «Precio · consulta 01/11/2026: "sharePrice":85» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- apartamento-vacacional-hinterstoder-50 · quita «Precio · consulta 01/11/2026: 36 órdenes de venta abiertas, 253 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Precio desde anunciado: 80 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Precio más bajo en mercado secundario (API) · 22/10/2026: 80,00 EUR» — precio de reventa del 22/10; la ficha ya tiene la venta más barata del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Participaciones disponibles en emisión (API) · 22/10/2026: 0 de 1.410» — foto del 22/10 de la emisión, ya cerrada; la ficha ya tiene las participaciones en venta del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Precio · consulta 01/11/2026: "sharePrice":72» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- vivienda-pottendorfer-stra-e-62-wr-neustadt · quita «Precio · consulta 01/11/2026: 19 órdenes de venta abiertas, 106 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- fotovoltaica-greenpoint · quita «Precio desde anunciado: 100 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- fotovoltaica-greenpoint · quita «Precio por participación · 22/10/2026: desde 100,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- fotovoltaica-greenpoint · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- fotovoltaica-greenpoint · quita «Precio · consulta 01/11/2026: "sharePrice":95» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- fotovoltaica-greenpoint · quita «Precio · consulta 01/11/2026: 16 órdenes de venta abiertas, 351 participaciones,» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- fotovoltaica-cohotel · quita «Precio desde anunciado: 110 EUR» — precio anunciado antiguo; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- fotovoltaica-cohotel · quita «Precio por participación · 22/10/2026: desde 110,00 EUR» — precio del 22/10; la ficha ya tiene la venta más barata y el mínimo del 20/11.
- fotovoltaica-cohotel · quita «Estado de la oferta · consulta 01/11/2026: "stage":"secondary","availableBricks":0,"available» — estado de la app del 01/11; la ficha ya tiene el mercado de reventa del 20/11.
- fotovoltaica-cohotel · quita «Precio · consulta 01/11/2026: "sharePrice":120» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- fotovoltaica-cohotel · quita «Precio · consulta 01/11/2026: 5 órdenes de venta abiertas, 65 participaciones, l» — precio u órdenes del 01/11 o anteriores; la ficha ya tiene la venta más barata, la orden de menor importe y las participaciones en venta del 20/11.
- spiko-letras-del-tesoro-euro · quita «Precio · consulta 01/11/2026: Latest NAV 1.0620 · 2026-11-01 ; amount 1.062032 E» — valor liquidativo del 30/10–01/11; la ficha ya tiene la rentabilidad con la VL del 20/11.
- spiko-letras-del-tesoro-euro · quita «Acceso desde España · consulta 01/11/2026: 🇪🇸 Spain ✅ (Smart Cash) ✅ (T-Bills Euro) ✅ (T-Bill» — la tabla de disponibilidad de Spiko del 23/10; la tarjeta ya dice lo de hoy con la tabla del 13/11.
- spiko-letras-del-tesoro-dolar · quita «Precio · consulta 01/11/2026: amount 1.101207 USD · day 2026-10-30» — valor liquidativo del 30/10–01/11; la ficha ya tiene la rentabilidad con la VL del 20/11.
- spiko-letras-del-tesoro-dolar · quita «Acceso desde España · consulta 01/11/2026: 🇪🇸 Spain ✅ ✅ ✅ ❌ (columna T-Bills Dollar ✅)» — la tabla de disponibilidad de Spiko del 23/10; la tarjeta ya dice lo de hoy con la tabla del 13/11.
- aktionariat · quita «Precio · consulta 01/11/2026: Price per DAKS 7.25 CHF» — precio del 01/11; la ficha ya tiene «Precio del emisor · 20/11/2026: 7,25 CHF por acción (fijo)».
- aktionariat · quita «Estado de la oferta · consulta 01/11/2026: Direct Investment – Invest in Aktionariat AG by bu» — estado del 01/11; la ficha ya tiene el precio del emisor del 20/11 (sigue vendiendo).
- boss-info · quita «Estado de la oferta · consulta 01/11/2026: Buy BOSS at 8.502 CHF · bank transfer or crypto» — precio, estado y operación del 01/11 o anteriores; la ficha ya tiene «Última operación · 20/11/2026».
- boss-info · quita «Precio · consulta 01/11/2026: Price per BOSS 8.5 CHF» — precio, estado y operación del 01/11 o anteriores; la ficha ya tiene «Última operación · 20/11/2026».
- boss-info · quita «Precio · consulta 01/11/2026: 28 Sep 2026 / 11:32 Secondary Trade 6.70 ZCHF 474 » — precio, estado y operación del 01/11 o anteriores; la ficha ya tiene «Última operación · 20/11/2026».
- boss-info · quita «Último cruce documentado: 8,44 CHF» — cruce del 29/08; la ficha ya tiene «Última operación · 20/11/2026» (8,40 ZCHF, 05/11/2026).
- switzerlend · quita «Estado de la oferta · consulta 01/11/2026: Buy LENDS at 68.0105 CHF · bank transfer or crypto» — precio y estado del 01/11; la tarjeta ya tiene el precio del emisor del 20/11 («1 acción (68,01 CHF el 20/11)»).
- switzerlend · quita «Precio · consulta 01/11/2026: Price per LENDS 68.01 CHF» — precio y estado del 01/11; la tarjeta ya tiene el precio del emisor del 20/11 («1 acción (68,01 CHF el 20/11)»).

En resumen, por ficha:

| Ficha | Qué se quita o re-fecha |
|---|---|
| Spiko Letras del Tesoro euro y dólar | Fecha del dato de «Acceso desde España» 06/11 → 13/11; se quitan el valor liquidativo del 30/10–01/11 y la tabla de disponibilidad del 23/10 (las dos ya superadas por la rentabilidad con la VL del 20/11 y la tabla del 13/11) |
| Spiko Smart Cash | Fuente GECO c124199 fuera; «Acceso desde España» con fecha del 13/11 y el alcance del informe de auditoría |
| mTBILL | Fuente `main-DOxid0Zj.js` (404) fuera |
| Las 11 de Brickwise | «Precio desde anunciado», precios del 22/10, participaciones en emisión del 22/10, estado del 01/11, precio y órdenes del 01/11 o anteriores: la ficha ya tiene la venta más barata, la orden de menor importe, las participaciones en venta y la mejor oferta de compra del 20/11 |
| Aktionariat | Precio y estado del 01/11 (ya está «Precio del emisor · 20/11/2026») |
| Boss Info | Precio, operación y estado del 01/11 y cruce del 29/08 (ya está «Última operación · 20/11/2026») |
| Switzerlend | Precio y estado del 01/11 (la tarjeta ya dice «1 acción (68,01 CHF el 20/11)») |
| Kraken, Robinhood, Prosegur | Nada (solo la fecha) |
| Hausera | Nada (la fecha y el comienzo del alcance de «Mínimo de inversión», que pone el motor) |

## Lo que se deja a propósito

Ver `DECISIONES-COORDINADOR.md` §3. En corto:

- Documentos, condiciones y hechos con fecha que siguen siendo ciertos: precio
  de emisión y mínimo del KID, moneda, plazo, comisiones, custodia, riesgos,
  qué se adquiere, salida, supervisión, folletos y condiciones finales,
  registros, desistimiento.
- Fotos de mercado o de estado **sin un dato de hoy que las sustituya**: los
  cruces, operaciones, horquillas, capitalización y accionistas de las tres
  suizas; patrimonio y partícipes de Spiko dólar; el estado en la AMF de las
  dos Letras; el TVL y las descripciones de mTBILL; el estado de Prosegur. No
  se pueden dar por superadas sin una lectura nueva; quedan para el próximo
  ciclo.

## El SQL (inventario)

288 sentencias en una transacción serializable: `begin`, la guarda (publicada
eca89db7 con su huella, catálogo no retirado, fecha del 20/11 al 27/11, destino
sin otra identidad), 284 inserts solo en `rwadar_catalogo` (25 plataformas, 22
ofertas, 69 fuentes, 25 alertas, 35 alerta_fuentes, 107 plataforma_fuentes, 1
revisión; las mismas filas por tabla que la 2026-11-20), la aprobación y
`commit`. Sin DDL, borrados ni permisos, y sin escribir en `public.*` (solo lee
`public.plataformas` y bloquea la fila de `public.catalogo_publicacion`
mientras dura). 20 sentencias cambian algo más que la revisión, la huella y la
fecha (las 18 ofertas con cambios, Hausera solo por ese comienzo del alcance, y
la aprobación).

## Cambios en el motor

El motor no sabía quitar una dirección de las fuentes de una ficha ni cambiar
solo la fecha de un dato de tarjeta. Ampliado (documentado en `FORMATO.md`):

- `fuenteQuita {url}`: solo si está una vez, se leyó hoy y nada la cita; si una
  referencia, dato de tarjeta, característica, la descripción o la oferta la
  cita, para.
- `tarjetaFecha {etiqueta, antes:{valor, fechaDato}, despues:{fechaDato, alcance?}}`:
  «antes» = lo publicado y lo leído hoy; el valor no cambia; fecha no
  posterior a hoy.
- Segunda entrega del mismo día: los avisos que la publicada de hoy ya
  comprobó (con fecha de hoy) siguen comprobados (si no, siete avisos añadidos
  esta tarde paraban el montaje).
- El ensayo en PGlite aplica la migración 38 (textos del radar en
  `public.plataformas`) después del lote 2026-11-20, como producción. Sin ella
  PGlite no daba lo mismo que la lectura de hoy (texto de addx).
- Pruebas nuevas en `motor.test.mjs` (el caso bueno y 8 guardas).

## Pruebas (salida real)

- `motor.mjs preparar 2026-11-20.2 --repetir` → `"repetido": "mismos SHA-256 las dos veces"`,
  revisión `1d2cd6b1…`, SHA-256 `7b13a3d2…8391`, 73 cambios, 73 pruebas, 0 no aplicados.
- `motor.mjs comprobar 2026-11-20.2 --exportar=…` (PGlite) → `"resultado": "correcto"`,
  19 comprobaciones y 6 casos de fallo. Entre ellas: PGlite antes de aplicar =
  la lectura de hoy (25/22/30 filas); idempotente; cada uno de los 73 cambios
  visible y lo de antes ya no; no aparecen `main-DOxid0Zj.js` ni
  `produit-d-epargne/c124199`; 4 fichas sin cambios iguales salvo las fechas;
  tarjetas: cambian 0 (el valor de ningún dato de tarjeta cambia); sincronizador
  real: 52 páginas, ninguna nueva ni retirada; los 6 casos de fallo (otra
  publicada, otra huella, catálogo retirado, destino con otra huella, lote
  caducado, catálogo incompleto) fallan sin dejar nada.
- `motor.mjs revisar 2026-11-20.2` → «73 cambios en 18 fichas; 0 tarjetas; 20
  sentencias del SQL con algo más que fechas e identificadores» (`DIFF-ENTREGA.md`).
- `node --test …/motor.test.mjs …/flujo.test.mjs` → 24 de 24 (con la prueba
  nueva de `fuenteQuita` y `tarjetaFecha`).
- `pglite.test.mjs` (repetición del 12/11): falla, pero **ya fallaba antes** de
  este cambio (mismo fallo en el commit 79b4037: `disponible_es` y métricas
  enmascaradas en la vista). No lo causa esta entrega; queda pendiente.
- Ensayo «después de aplicar» en una copia aparte (`ensayo-despues.json`):
  preparar 0, comprobar 0, después antes de sincronizar 1 (a propósito),
  sincronizar 0 (25/5/22), después 0 («11 mínimos cortos»; 43 de 44
  comprobaciones al 20/11), repetir 0 («Nada que cambiar»), volcar-seed 0,
  transparencia 0 (22), fichas 0 (22 páginas). `npm test`: 692 de 695, 2
  saltadas y 1 fallo esperado («sin lectura en línea de la revisión 1d2cd6b1»:
  solo existe tras aplicar de verdad). Con esa lectura simulada solo en la
  copia, ese archivo da 25 de 25.

## Lo que no se aplicó tal cual

Nada de la lista cerrada. Lo que se deja a propósito está arriba y en
DECISIONES §3.

## Pasos para aplicarla (con el permiso del ciclo)

1. Revisión única de la entrega (SQL, contenido y cumplimiento) desde
   `DIFF-ENTREGA.md`, con el SQL de `sql-revisado-2026-11-20.2/`.
2. `motor.mjs auditar 2026-11-20.2 --antes=<copia> --revisado=7b13a3d2…8391 --exigir-secretos --escribir`.
3. Aplicar `rwadar-app/data/importaciones/catalogo-2026-11-20.2-v2/aplicar-y-aprobar.sql`
   en Supabase antes del 27/11 (si la publicada ya no es la eca89db7, la guarda
   para y no deja nada).
4. Leer como visitante (`lectura-despues-de-aplicar/`), `node rwadar-app/sincronizar.js`,
   `despues-de-aplicar.mjs`, `transparencia.mjs`, `rwadar-fichas.js`, `npm test`,
   PR y publicar la web. Sin OTA (la app lee el catálogo en línea).
5. Aviso «Avisar novedad» (tipo `novedad`, en llano, enlace a las ofertas).
