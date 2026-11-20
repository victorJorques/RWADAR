# Revisión independiente · grupo acciones-oro-tesoro · 20/11/2026

Revisión hecha entre las 17:03 y las 17:06 UTC del 20/11/2026, abriendo yo
mismo las fuentes. Copias en `fuentes/acciones-oro-tesoro/` (los PDF y HTML se
quedan fuera de Git por el `.gitignore` del ciclo; sus SHA-256 van abajo).

**Resultado: aprobado con un cambio obligatorio** (una copia del grupo lleva
nombres de personas físicas; ver «Correcciones obligatorias»). Las cifras y
decisiones de las cuatro fichas se sostienen.

## mTBILL · actualizar → confirmado

- **Oráculo del emisor** (`eth_call` a 0x056339C0…2b5b en
  ethereum-rpc.publicnode.com, 17:03:54 UTC; 8 decimales):
  - ronda 498 (la última, `latestRoundData` = 498): **1,07890125 USD**, del
    20/11/2026 a las 11:41:35 UTC → «1,0789 USD (20/11/2026)». Correcto.
  - ronda 475: **1,07534190 USD**, del viernes 16/10/2026 a las 13:47:47 UTC.
    Es el mismo día de la semana cinco semanas antes (las vecinas son la 474
    del 15/10 y la 476 del 19/10).
  - 34,912 días → (1,07890125 / 1,07534190 − 1) × 365 / 34,912 = **3,4605 %
    → 3,46 % anual en USD** (3,515 % compuesto). Coincide con el expediente y
    con el vigía.
  - La etiqueta («5 semanas hasta el 20/11/2026») y el aviso («del 16/10 al
    20/11/2026») cambian a la vez, como debe ser.
- **Conflicto de reembolso: sigue.** Condiciones Finales (gitbook, 17:04:23 UTC,
  SHA-256 b1e58001ec0f688a…, mismo que el expediente): «Redemption Gates 25% of
  the aggregate number of outstanding mTokens per settlement day»; «Minimum
  Investment Amount not applicable»; «Offer(s) to the Public Spain, Poland, …».
  KID en español (17:04:23 UTC, SHA-256 6c22870917cda81e…, mismo): «no
  reembolsará más del 15 % de todos los Productos en circulación en ningún día
  de liquidación» y «podrá retenerse hasta el 50 %». El estado
  `fuentes_en_conflicto` es correcto.
- ESMA (ISIN CH1371002986, 17:04:23 UTC): 3 documentos, el último FTWS del
  17/07/2026; nada nuevo. CNMV pasaportes (LEI 984500BB00BN6D2B7C48, 17:04:24
  UTC): BPWO-84 sigue.
- Advertencias de la CNMV «Midas» (17:04:25 UTC): «No hay datos disponibles.»
- midas.app/mtbill: 403 a las 17:04:23 UTC (mismo bloqueo que el investigador).
- resumenTarjeta: las tres frases son iguales que el 13/11 (41, 46 y 107
  caracteres), en castellano llano y respaldadas por las Condiciones Finales y
  el KID de hoy.

## Kraken xStocks · actualizar → confirmado

- **«Más de 1.000»**: eu.kraken.com/es-es/xstocks (17:04:23 UTC, HTTP 200):
  «Kraken ofrece acceso a más de 1.000 acciones y ETF de EE. UU., incluidos
  nombres como Tesla (TSLAx), Apple (AAPLx)…»; en inglés (eu.kraken.com/xstocks,
  17:04:23 UTC): «Kraken offers access to 1,000+ U.S. stocks and ETFs». Ya no
  aparece «130» con acciones/ETF en la página. El cambio del resumen se sostiene.
- Mínimo: «Start with as little as €1 EUR» y «¿Cuál es la inversión mínima de
  los xStocks?» en la misma página. Igual.
- **Condiciones finales con España: no hay.** ESMA (LEI 984500001AB7C6C7F577,
  17:04:25 UTC): 1.732 documentos; el más reciente, FTWS del 19/11/2026 del ISIN
  CH1588667217. Lo descargué de l-p-a.com (17:04:24 UTC, SHA-256
  116a61b3204d37ed…, igual que el del investigador): «Final Terms for Product
  Nr. 1,547 Anthropic xStock ANTx», «The Products will be offered in
  Liechtenstein and Switzerland (only to Swiss Professional Investors)»; España
  solo en la lista de países donde se notificó el folleto. Los avisos y la
  métrica «Condiciones finales» siguen siendo exactos.
- Condiciones finales de SPYx (CH1436219716) hoy: SHA-256 280159d434561e53…,
  igual que el expediente.
- CNMV ESI 4474 (17:04:24 UTC): «PAYWARD EUROPE DIGITAL SOLUTIONS (CY)
  LIMITED». Advertencias CNMV «Kraken» (17:04:25 UTC): «No hay datos
  disponibles.»
- resumenTarjeta: igual que el 13/11 (46, 100 y 93 caracteres), conforme.
- El nuevo resumen largo («…más de 1.000 acciones y ETF de EE. UU. …») no es
  resumenTarjeta: no aplica el límite de 120 caracteres.

## Robinhood Classic Stock Tokens · mantener → confirmado (muestreo)

- robinhood.com/eu/es/invest (17:04:23 UTC, 200): «Empieza con tan solo 1 €»,
  «Explora más de 2.000 Classic Stock Tokens vinculados a acciones y ETP de
  EE. UU.», «Compra y vende Classic Stock Tokens 24/5, de lunes a viernes».
- KID en español (17:04:23 UTC): SHA-256 84f4f0a815734c1d…, igual que el
  expediente.
- CNMV ESI 5299 (17:04:24 UTC): «ROBINHOOD EUROPE, UAB», SHA-256 de la página
  cd36b27873857b29…, igual que la copia del investigador. Lista CASP de la CNMV
  (17:04:24 UTC, SHA-256 0dea9e14f8f7aacb…, la misma): «ROBINHOOD EUROPE, UAB …
  16/06/2025». Advertencias CNMV «Robinhood» (17:04:25 UTC): «No hay datos
  disponibles.»

## Prosegur Digital Gold · mantener → confirmado (muestreo)

- prosegurcrypto.com/digital-gold (17:04:27 UTC, 200): «Compra mínima ✔ 1
  gramo», «1 Token Digital* = 1 gramo de oro real».
- Contrato app.prosegurdigitalgold.com/#/terms-service (navegador con es-ES,
  17:05:12 UTC): «Actualizado el 08/07/2026»; «Precio LBMA diario + 4%» y
  «Precio LBMA diario - 6%»; recompra «en un plazo de 1 a 7 días hábiles
  aproximadamente»; «SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE
  NINGÚN REGULADOR FINANCIERO».
- Lista CASP de la CNMV (17:04:24 UTC): «PROSEGUR CUSTODIA DE ACTIVOS
  DIGITALES, S.L. … 30/06/2026». Advertencias CNMV «Prosegur» (17:04:25 UTC):
  «No hay datos disponibles.»

## Lo re-fechado con el vigía (muestreo)

Todo lo marcado `segunVigia` en las cuatro fichas está en `vigia.json` como
«no cambia» (ninguno como «cambia», «no se pudo leer» ni ausente). Abrí hoy
tres documentos re-fechados y su SHA-256 coincide con el del vigía:

| Documento | Hora UTC | SHA-256 de hoy = vigía |
|---|---|---|
| Segundo suplemento de Backed (mfsa.mt) | 17:04:23 | acb0376b2b87f62d… sí |
| Tabla de comisiones de Robinhood UE | 17:04:23 | 614b0f5b0019b6b7… sí |
| KID inglés de Robinhood | 17:04:23 | d744e3ac63962771… sí |

Las búsquedas de advertencias de la CNMV (Kraken, Midas, Robinhood, Prosegur)
dan hoy «No hay datos disponibles.», igual que el vigía; el SHA-256 de la
página no coincide con el del vigía porque la página cambia en cada carga, pero
el resultado es el mismo.

## Bloqueos

- midas.app/mtbill: 403 (17:04:23 UTC). El APY oficial de Midas sigue sin leerse.
- No reabrí la API de la FMA de Liechtenstein ni assets.backed.fi (el
  investigador ya documenta 400 y «Access Restricted»; no cambian la tarjeta).

## Correcciones obligatorias

1. **Nombres de personas físicas en una copia del grupo.**
   `grupos/acciones-oro-tesoro/fuentes/mtbill-ft.txt` (texto extraído de las
   Condiciones Finales) contiene los nombres de los administradores del emisor y
   de su matriz (23 líneas con «Herr»/«Mr.»/«domnul» seguidos de nombre). Los
   `.txt` del grupo **sí** van a Git según el `.gitignore` del ciclo. Antes del
   commit hay que moverlo a `fuentes/crudo/` (fuera de Git) o borrar esas
   líneas, y ajustar `inventario-consultas.json`. El resto de copias del grupo,
   el resumen y los cuatro expedientes no tienen nombres de personas físicas
   (los correos que aparecen son genéricos: info@fma-li.li, contact@…,
   team@…, complaints_eu@…). Yo no guardé el `.txt` de ese PDF en mi carpeta.

Sin correcciones a los datos de las fichas.
