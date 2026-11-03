# Revisión independiente · Brickwise · 2 de noviembre de 2026

Revisor: Claude (no participó en la investigación). Alcance: las 12 fichas publicadas
de Brickwise y la coherencia de sus 4 candidatas no admitidas. Solo fuentes públicas,
sin login, KYC ni formularios. Copias de trabajo en el scratchpad del revisor (no en
el repositorio). Horas en UTC, todas del 02/11/2026.

## Lecturas propias (hora real)

| # | Fuente | HTTP | Hora UTC | Nota |
|---|---|---|---|---|
| 1 | https://api.app.brickwise.at/api/v2/assets | 200 | 16:26:43 | 14 activos; SHA-256 empieza por `b66346d157c1` (= la copia del investigador) |
| 2 | https://api.app.brickwise.at/api/v1/assets | 200 | 16:26:44 | 17 activos con libro de órdenes (`offers[]`) |
| 3 | https://bwrealestate.app.brickwise.at/api/v1/asset/AT0000A3SE89 (BILLA) | 200 | 16:26:46 | `updatedAt` 2026-10-26T22:26:36Z |
| 4 | …/api/v1/asset/<ISIN> de las 11 de reventa | 200 ×11 | 16:27:27–16:27:31 | contratos de alquiler y `rentalReturn` |
| 5 | KID BILLA https://staging.cdn.brickwise.at/081398c1-7f37-4b88-875a-215bcf23371d.pdf | 200 | 16:28:26 | SHA `3f3206fd1c95…` = expediente |
| 6 | Informationsblatt AltFG BILLA https://staging.cdn.brickwise.at/50f3df2f-9e58-4809-8e8c-51da1abc3856.pdf | 200 | 16:28:27 | SHA `d30134b31232…` = expediente |
| 7 | KID y contrato Randhartingergasse (cdn …/8c331bfe…, …/5cfbdc1f…) | 200 | 16:28:28 | SHA = expediente |
| 8 | KID y contrato GreenPoint (cdn …/f6c7c7ff…, …/5d912bfb…) | 200 | 16:28:29 | SHA = expediente |
| 9 | KID Plüddemanngasse (cdn …/f96b7e13…) y KID Hinterstoder 50 (cdn …/3aa9bf9c…) | 200 | 16:28:29–30 | SHA = expediente |

## 1. terreno-con-arrendamiento-billa · veredicto: **aprobada_con_cambios** (y mover a `en_camino`)

### Hechos comprobados por mí

- **Estado (API v2, 16:26:43):** `stage=primary`, `bricks=6404`, `availableBricks=6322` →
  **82 participaciones suscritas = 8.200 €**. Umbral 5.000 participaciones / 500.000 €
  → **1,64 % del umbral**. `updatedAt` 2026-10-29T12:39Z. Sin órdenes de reventa (`offers=[]`).
- **Plazo (ficha v1, 16:26:46):** `issueStartDate` 2026-02-15T23:00Z, `issueEndDate` =
  `issueEndDateOriginal` = 2026-05-15T22:00Z (= 16/05/2026, hora de Viena). **La propia API no
  registra prórroga.** Informationsblatt, Teil B, p. 3: «Zeichnungsfrist endet am 16.05.2026 um
  23:59 Uhr … kann … mehrmals, maximal jedoch um bis zum dreifachen des ursprünglichen
  Ausgabezeitraums verlängert werden». Periodo original ≈ 3 meses → prórroga máxima de ≈ 9 meses
  → **fin máximo ≈ 16/02/2027**. Si se lee «hasta el triple en total», el fin sería ≈ 16/11/2026
  (dentro de dos semanas). No encontré publicación de prórroga. **Conflicto confirmado.**
- **Si no se alcanza el umbral** (p. 3): el contrato se disuelve y el dinero se devuelve
  «kostenfrei und ohne Verzinsung». Confirmado.
- **Mínimo:** «Der Mindestzeichnungsbetrag beträgt EUR 1.000,00» (Informationsblatt, Teil D);
  API `minSubscriptionAmount=10` participaciones de 100 €. Confirmado.
- **Precio:** KID p. 1: «Nennbetrag je Token … EUR 100,00; … Gesamtbetrag … EUR 640.400,00». Confirmado.
- **Reparto 5,07 %: es un objetivo/previsión, no un dato histórico.** Ficha v1, `rentalDetails`:
  renta 67.170,36 € − «Submietvertrag» 33.277,44 € − gestión 1.021,49 € − reserva 420,00 € =
  **excedente previsto 32.451,43 €** (la suma cuadra al céntimo); 32.451,43 / (6.404 × 100 €) =
  **5,067 % ≈ 5,07 %**. Es un presupuesto anual: la emisión no se ha ejecutado y el «primer
  reparto previsto» (`plannedFirstRentalIncomeDate` 15/07/2026) ya pasó **sin que haya habido
  ningún reparto**. El KID (p. 2) usa otro número, **5,23 %/año** de reparto medio en sus
  escenarios (con indexación supuesta del 2 %) más revalorización. Bruto de KESt y sin el 1,5 %
  de comisión. Conflicto de base confirmado.
- **Riesgo:** KID: «Risikoklasse 6», «wobei 6 der zweithöchsten Risikoklasse entspricht». Confirmado.
- **Fondos propios negativos:** Informationsblatt p. 8: «per 31.12.2024 ein negatives Eigenkapital
  in Höhe von rund EUR 83.000,00 … Bilanzverlust … rund EUR 85.000,00». Confirmado.
- **Garantía:** el Informationsblatt dice que la inscripción en el registro «beantragt» (solicitada);
  la API lo da como pendiente. Confirmado como pendiente.
- **Contrato de alquiler:** ficha v1 `contractStartDate` 2012-12-30, `contractEndDate` 2057-12-30,
  ocupación 100 %, `payoutInterval=monthly` (reparto mensual, día 15). La ficha v1 enlaza además un
  documento `rentalAgreement` (staging.cdn …/61a38504…pdf) que el expediente **no lista**; podría
  explicar la partida «Submietvertrag». No lo leí (presupuesto de lecturas): queda como tarea.

### Discrepancias

1. El expediente atribuye a la ficha v1 el `updatedAt` 2026-10-29T12:39Z y el SHA `b66346d1…`, pero
   ambos son del listado **v2**; la ficha v1 tiene `updatedAt` 2026-10-26T22:26Z. Menor (trazabilidad).
2. El 5,07 % se presenta como «Rentabilidad publicada»; es una previsión de presupuesto de una
   emisión que puede no ejecutarse. Con el criterio «no conviertas un objetivo en rendimiento»,
   puede mostrarse solo si la etiqueta dice «previsto» y va acompañada del aviso de umbral.
3. «Submietvertrag» resta el 49,5 % de la renta bruta y no se explica: el expediente lo anota
   como bloqueo, correcto, pero no cita el documento `rentalAgreement` disponible.

### ¿Principales o en_camino?

**Recomiendo `en_camino`** (decide Víctor). Motivos comprobados: ocho meses y medio después de abrir (16/02/2026)
solo hay el 1,64 % del umbral; el plazo publicado venció; la API no registra prórroga; el primer
reparto previsto ya pasó sin ejecución; el emisor tiene fondos propios negativos; acceso desde
España no confirmado. En «principales» con una cifra del 5,07 % parecería una inversión que ya
renta, y lo más probable con los datos de hoy es que la emisión no llegue a ejecutarse.

### Cambios obligatorios

1. `coleccion`: `en_camino` (o, si Víctor la mantiene en principales, el aviso de umbral debe ir
   el primero y con la cifra «82 de 5.000»).
2. `rentabilidad.mostrada` «5,07 %» solo con etiqueta «Reparto anual previsto (presupuesto, no
   ejecutado)». Métrica: «Reparto previsto · base: excedente presupuestado / nominal · API 26/10/2026».
   Añadir en `literal` que el KID usa un 5,23 % en sus escenarios.
3. Aviso de plazo: «El plazo publicado terminó el 16/05/2026 y la API no muestra prórroga; el
   contrato permite prorrogarlo hasta un máximo que no se ha publicado».
4. Paso 4 «Reparto mensual variable» → «Reparto si se emite» (hoy no hay reparto posible).
5. Corregir la trazabilidad del `updatedAt`/SHA (discrepancia 1).

### Bloqueos

- Prórroga del plazo: sin publicación. Documento `rentalAgreement` no leído. Advertencias CNMV: ver §3.

## 2. Las 11 de reventa · veredicto en bloque: **aprobada_con_cambios** (las 11)

Muestra documental (KID y/o contrato leídos por mí): **Randhartingergasse 9** (vivienda, contrato
vencido), **Fotovoltaica GreenPoint**, **Plüddemanngasse 101** (contrato vencido) y **Hinterstoder 50**
(apartamento turístico, con rentabilidad). La API (precio, libro de órdenes, contrato de alquiler)
la comprobé en **las 11**.

### Hechos comprobados por mí

| Ficha | `sharePrice` hoy | Venta más barata (cantidad a ese precio) / total en venta | Mejor compra (cantidad, fecha) | Contrato de alquiler en la API (campo / descripción) | `rentalReturn` |
|---|---|---|---|---|---|
| Plüddemanngasse 101 | 76,00 € | 80 € (**2**) / 333 | 20 € (1, 23/04/2026) | 10/05/2021 / «endet am 31.07.2024» → vencido | 3,96 (no se muestra ✓) |
| Sonnleithnergasse 2 | 80,00 € | 75 € (11) / 96 | 69 € (1) | 29/11/2026 / texto de 2023 («Nachmieter ab Dezember») | 3,21 (no se muestra ✓) |
| Estanco Klagenfurt | 95,00 € | 95 € (15) / 301 | 88 € (1) | indefinido («unbefristet») | 3,46 ✓ |
| Stallhofstraße 28 | 69,96 € | 69,90 € (1) / **313** | 30 € (1) | 01/02/2022 / **«endet am 31.03.2027»** → **conflicto, no vencido según la descripción** | 4,11 (no se muestra) |
| Schwarzer Weg 18 | 65,00 € | 69,90 € (1) / **299** | 60 € (1) | 01/02/2022 / «endet am 30.08.2023» → vencido | 3,73 (no se muestra ✓) |
| Drautalresidenz | **70,00 €** (exp.: 67,80) | 70 € (3) / 150 | 54 € (1) | indefinido | **4,68** (exp.: 4,83) |
| Randhartingergasse 9 | 75,00 € | 78 € (21) / 184 | 40,50 € (10, 22/04/2026) | 30/06/2024 / inquilino se fue el 28.02.2026, «Nachmieter wird gesucht» → vacía | 2,47 (no se muestra ✓) |
| Hinterstoder 50 | 85,00 € | 72 € (5) / **263** | 65 € (1) | indefinido, renuncia a cancelar 20 años | 4,10 ✓ |
| Pottendorfer Str. 62 | 72,00 € | **78 €** (21) / **127** (exp.: 80 € / 106) | 63 € (1) | 29/11/2025 / «endet am 30.11.2025» → vencido | 4,22 (no se muestra ✓) |
| Fotovoltaica GreenPoint | 95,00 € | 100 € (5) / 351 | 90 € (1) | no aplica (producción) | 6,43 ✓ |
| Fotovoltaica Cohotel | 120,00 € | 110 € (35) / 65 | **3 € (1, 23/11/2024)** | no aplica | 5,11 ✓ |

Fuentes: API v2 (16:26:43), API v1 `offers[]` con `status=open` (16:26:44) y fichas v1 (16:27:27–31).

- **Etapa:** las 11 tienen `stage=secondary` y `availableBricks=0`, salvo Randhartingergasse
  (`availableBricks=374` con emisión cerrada el 15/09/2022; anomalía ya anotada). **Pasar a
  `secundario` está justificado.**
- **Cómo se calcula la rentabilidad:** comprobé que `rentalReturn` = excedente previsto /
  (participaciones totales × `sharePrice`) en Klagenfurt (11.828,12 / 342.000 = 3,46 %),
  Drautal (5.206,62 / 111.300 = 4,68 %), Hinterstoder (14.233,22 / 346.800 = 4,10 %),
  GreenPoint (10.942,56 / 170.050 = 6,43 %) y Cohotel (4.909,64 / 96.000 = 5,11 %). Es una
  **previsión sobre el precio de referencia**, no sobre el precio al que se compra ni un reparto pagado.
- **Libro de órdenes:** es un **tablón** (`contactType=bulletin`), no una bolsa con casación; hay
  órdenes «open» desde 2021 (p. ej. Plüddemanngasse, venta a 140 € creada el 07/11/2021).
- **KID:** «Risikoklasse 6» / «Risikoindikator 6» en los cuatro KID de la muestra ✓. Tenencia
  recomendada: Randhartingergasse 10 años, GreenPoint 15, Plüddemanngasse y Hinterstoder 5.
- **Precio de emisión:** Randhartingergasse «Ausgabepreis: EUR 100,24» (contrato, p. 4) ✓.
- **Salida:** Randhartingergasse «Ordentliche Kündigung: Nein» ✓. Plüddemanngasse y Hinterstoder
  (KID): plazo perpetuo, sin cancelación ordinaria **mientras coticen en un mercado**; si dejan de
  cotizar, el inversor puede cancelar con 6 meses de preaviso al 31/12 ✓ (matiz menor).
  GreenPoint: KID «Beendigungszeitpunkt: 31.12.2038 (15 Jahre)», API `maturityDate` 2038-12-30T23:00Z;
  devolución «qualifiziert nachrangig» ✓. Cohotel: misma `maturityDate` en la API ✓.
- **Derecho:** GreenPoint, contrato §5.1: «quotale Beteiligung an 95 % des Jahresüberschusses» ✓;
  la descripción de Cohotel en la API dice 50 % (otro emisor; no comprobé el §9.1 citado por el investigador).
- **Comisión 1,5 %:** la leí en el Informationsblatt de BILLA (Teil F: «Vermittlungsprovision in
  Höhe von 1,5%»). No releí el documento general «Kosteninformationen» (presupuesto de lecturas);
  el SHA del investigador es el mismo en las 11 fichas.
- **Documentos:** los 6 PDF de la muestra tienen el mismo SHA-256 que los expedientes.

### Discrepancias

1. **La cifra entre paréntesis de «Venta más barata» engaña.** «80,00 € (333 participaciones)» da a
   entender que hay 333 a 80 €; a 80 € solo hay **2**. El 333 es el total en venta a todos los
   precios (hasta 140 €). Pasa en las 11 (Stallhofstraße: 1 a 69,90 € de 313; Schwarzer Weg: 1 de 299).
2. **«Mejor compra publicada» sin cantidad ni fecha engaña**: casi siempre es 1 participación;
   en Cohotel, 3 € por 1 participación desde el 23/11/2024 (orden simbólica).
3. **Stallhofstraße:** el aviso «cita un contrato ya vencido» no es exacto. La API tiene un campo
   vencido (01/02/2022), pero su descripción dice que el contrato se renovó el 01/03/2024 y termina
   el **31/03/2027**. Ocultar la cifra es prudente (hay conflicto), pero el motivo debe ser el conflicto.
4. **Datos que ya han cambiado en 24 h:** Drautalresidenz (70,00 € y 4,68 %, `updatedAt`
   02/11 12:46Z) y Pottendorfer (venta más barata 78 €). Totales en venta distintos en Stallhofstraße,
   Schwarzer Weg, Hinterstoder, Randhartingergasse y Pottendorfer.
5. El resumen del investigador dice «No se muestra en **5** fichas» y enumera **6**. Las tarjetas
   tienen bien las 6 a `null`.
6. La API da ocupaciones del 97–99 % en viviendas vacías (Randhartingergasse 99,1 %, Plüddemanngasse
   97,2 %): el campo `occupancyRate` no es fiable y no debe usarse.

### Cambios obligatorios (las 11)

1. Métrica «Venta más barata»: «80 € (2 participaciones) · 333 en venta a varios precios · API 02/11/2026»,
   o quitar la cantidad. Igual en las 11.
2. «Mejor compra»: quitarla o poner cantidad y fecha. En Cohotel, quitarla.
3. Fechar todas las cifras de mercado y de rentabilidad con la fecha de la API y **regenerarlas el
   día de publicación** (Drautal: 70,00 € / 4,68 %; Pottendorfer: 78 € / 127).
4. Etiqueta de la rentabilidad: «Rentabilidad prevista sobre precio de referencia (no sobre el
   precio de compra)».
5. Stallhofstraße: aviso «Datos de alquiler contradictorios en la API (fin 2022 en un campo, 2027 en
   la descripción); la rentabilidad no se muestra».
6. Randhartingergasse: añadir «Vivienda sin inquilino desde el 28/02/2026 según la API».
7. Paso 3 en las 6 sin rentabilidad: «Reparto variable, puede faltar» (en vez de «Reparto mensual
   variable»).
8. **Categoría de las dos fotovoltaicas: «Infraestructura»**. «Energía e infraestructura» no está
   en el catálogo (el generador admite `'Infraestructura'`: `rwadar-app/generar-escaparate-local.mjs:48`;
   publicado hoy, las 12 están como «Inmobiliario», que es incorrecto para estas dos).

Agruparlas en una sola tarjeta «Brickwise · mercado de reventa» también me parece defendible: 6 de 11
no tienen una cifra fiable y los libros son finos. Lo decide Víctor.

## 3. Entidad, registros y advertencias (vale para las 12)

- **BaFin, Effecta GmbH** (16:35:14,
  https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=133261):
  «Wertpapierinstitut», BaFin-ID 10133261, Florstadt; Anlageberatung (§ 2 Abs. 2 Nr. 4 WpIG) y
  Anlagevermittlung (§ 2 Abs. 2 Nr. 3 WpIG) desde el 26.06.2021, sin fecha de fin ✓.
- **BaFin, agente vinculado nº 80174029 (Brickwise Investment GmbH):** **no lo pude confirmar yo.**
  La búsqueda por número en https://portal.mvp.bafin.de/database/VGVInfo/komfortsucheForm.do
  (16:35:36, «Stand der Daten: 01.11.2026») devolvió «más de 1.000 resultados» (solo exportable en
  CSV/XML). Queda respaldado por la lectura del investigador (01/11 15:02:47Z) y por el aviso legal de
  Brickwise. No es discrepancia; es un hueco de mi revisión.
- **CNMV, Effecta** (16:35:40,
  https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?numero=5003&tipo=CLP): «EFFECTA GmbH ·
  Empresas de Servicios de Inversión del EEE en Libre Prestación · Nº Registro Oficial 5003 · 11/11/2020»,
  Florstadt (Alemania) ✓. No abrí las pestañas «Programa de actividades» ni «Agentes».
- **CNMV, lista de advertencias: repetida con éxito.** Buscador de entidades advertidas
  (https://www.cnmv.es/portal/BusquedaAdvertencias?lang=es), tipo «No autorizadas», por denominación:
  «Brickwise» (16:32:07), «Effecta» (16:32:15), «Brick Qogir» (16:32:53), «Sagarmatha» (16:34:02),
  «BrickOne» (16:34:40), «Green-Point» (16:34:50), «Cohotel» (16:35:02) → en todas **«No hay datos
  disponibles»**. Alcance: no consulté la pestaña «Advertencias de reguladores extranjeros». Cambio:
  quitar el bloqueo «timeout» de los 16 expedientes y poner «sin coincidencias (CNMV, no autorizadas,
  02/11/2026)».
- Coherente con el expediente: `disponibleEs: no_confirmado` en las 12 (cuenta EEE sí; distribución
  de cada emisión en España no documentada; documentos solo en alemán).

## 4. Texto de las tarjetas

- Sin promesas ni superlativos en títulos, resúmenes y avisos ✓.
- Pasos de 4 palabras como máximo, sin cifras ni marcas ✓ (con los cambios de pasos de arriba).
- Conceptos sin marcas ni cifras ✓ (el de BILLA dice «supermercado de pueblo», sin la marca).

## 5. Las 4 candidatas no admitidas · coherentes

Comprobado en la API (16:26:43–44):
- **Parkhaus Q2 St. Pölten** (AT0000A3E842): `stage=secondary`, 219/460 «disponibles» a 507,62 €,
  `availableBricksSecondary=0`, sin órdenes. Con el contrato limitando la suscripción a 2024–2025,
  **no_admitir** es coherente.
- **Ferienimmobilie Fixpacht Hinterstoder** (AT0000A35A42): reventa, 71 en venta desde 98 € (4 a ese
  precio), mejor compra 17,50 €, `rentalReturn=-0,12` ✓. **no_admitir** coherente. Ojo: la
  «garantía pendiente» que se cita como motivo también la tiene la publicada Pottendorfer; el motivo
  que pesa es la rentabilidad prevista negativa.
- **Ferienapartment Hinterstoder 2** (AT0000A3AAY4) y **Neubauwohnung Wien 22** (AT0000A3AAX6):
  `stage=deleted`, sin órdenes ✓. **no_admitir** coherente.
- «KTGG-0944» con `stage=test` ✓: bien excluido.

## Tabla final

| Slug | Veredicto | Cambio clave |
|---|---|---|
| terreno-con-arrendamiento-billa | aprobada_con_cambios | pasar a `en_camino`; 5,07 % como «previsto»; aviso de plazo sin prórroga en la API; paso 4 |
| vivienda-pluddemanngasse-101-graz | aprobada_con_cambios | cantidades del libro; paso 3 |
| vivienda-sonnleithnergasse-2-viena | aprobada_con_cambios | cantidades del libro; paso 3 |
| local-de-estanco-klagenfurt | aprobada_con_cambios | cantidades; etiqueta de rentabilidad |
| vivienda-stallhofstra-e-28-gratwein | aprobada_con_cambios | aviso de conflicto (no «vencido»); cantidades; paso 3 |
| vivienda-schwarzer-weg-18-graz | aprobada_con_cambios | cantidades; paso 3 |
| drautalresidenz-paternion | aprobada_con_cambios | **70,00 € / 4,68 %** (dato del 02/11); cantidades |
| randhartingergasse-9-viena | aprobada_con_cambios | aviso «sin inquilino»; cantidades; paso 3 |
| apartamento-vacacional-hinterstoder-50 | aprobada_con_cambios | cantidades; etiqueta de rentabilidad |
| vivienda-pottendorfer-stra-e-62-wr-neustadt | aprobada_con_cambios | **78 € / 127** (dato del 02/11); paso 3 |
| fotovoltaica-greenpoint | aprobada_con_cambios | categoría **Infraestructura**; cantidades |
| fotovoltaica-cohotel | aprobada_con_cambios | categoría **Infraestructura**; quitar «mejor compra 3 €» |

Ninguna rechazada. Bloqueos que quedan: agente vinculado BaFin no reconfirmado por mí; documento
`rentalAgreement` de BILLA sin leer; pestaña de advertencias de reguladores extranjeros de la CNMV,
lista de advertencias de la FMA y Firmenbuch sin consultar; `sharePrice` sin metodología publicada.
