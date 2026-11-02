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

**Recomiendo `en_camino`** (decide Víctor). Motivos comprobados: 9 meses y medio después de abrir
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
