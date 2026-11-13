# Revisión independiente · grupo «principales» · 13/11/2026

He intentado rebatir los siete expedientes del grupo abriendo yo mismo las
fuentes primarias el 13/11/2026 entre las **08:45 y las 08:52 UTC**, después
del investigador (08:30–08:41 UTC). No preparé estos expedientes. Solo he
leído páginas, documentos, API, registros públicos y datos en cadena. No he
iniciado sesión ni hecho KYC, y no he tocado wallets ni formularios.

## En una frase

Las cifras nuevas de Spiko y todos los «sin cambios» se sostienen con la
fuente de hoy. Hay que corregir una fecha: las tres fichas de Spiko siguen
citando la tabla de países «Last updated: October 23, 2026», pero hoy esa
tabla dice **«Last updated: November 6, 2026»**.

| Ficha | Propuesta | Mi veredicto |
|---|---|---|
| Spiko Letras del Tesoro Euro | actualizar a 2,40 % (VL 12/11) | confirmado con cambios (fecha de la tabla de países) |
| Spiko Letras del Tesoro Dólar | actualizar a 3,98 % en USD (VL 12/11) | confirmado con cambios (la misma fecha) |
| Spiko Euro (Smart Cash) | actualizar la fecha (2,84 %, VL 12/11) | confirmado con cambios (la misma fecha) |
| mTBILL | mantener | confirmado |
| Robinhood Classic Stock Tokens | mantener | confirmado |
| Kraken xStocks | mantener | confirmado |
| Prosegur Digital Gold | mantener | confirmado |

No hay ninguna `admitir_propuesta` ni `retirar_propuesta` en este grupo.

## Spiko: las tres cifras

**API pública de Spiko** (`https://public-api.spiko.io/v0/share-classes/<clase>/yield`
y `/v0/net-asset-values/<clase>/latest`, 08:45:18–08:45:20 UTC):

- **EUTBL:** `"monthlyYield":"0.024"`, actualizado el 12/11 a las 17:44:43
  UTC. VL `1.062803` EUR del 12/11.
- **USTBL:** `"monthlyYield":"0.0398"`, actualizado el 12/11 a las 17:44:58
  UTC. VL `1.102694` USD del 12/11.
- **eurSAFO:** `"dailyYield":"0.0284"`. VL `1.017107` EUR del 12/11,
  calculada a las 20:39:20 UTC.
- **Próximas VL:** hoy a las 18:00 UTC (letras) y a las 19:30 UTC (Spiko
  Euro), según `nextYieldTimestamp`.

**Mi recálculo con la serie de VL** (`?startDay=2026-09-20`):

- EUTBL, 31 días (12/10→12/11): **2,400 %** capitalizando.
- USTBL: el 12/10 no tiene VL (festivo en EE. UU.). Con el 13/10 (30 días)
  sale **3,984 %**, que es la cifra de la API.
- eurSAFO, capitalizando: 2,839 % a 1 día, 2,834 % a 7 días y 2,833 % a 31
  días.

**Otras fuentes, misma cifra:**

- `https://www.spiko.io/es/spiko-letras-del-tesoro-euro` (08:46:12 UTC):
  «2,40% Rendimiento neto actual» y «de los últimos 31 días».
- `https://www.spiko.io/es/spiko-letras-del-tesoro-dollar` (08:46:12 UTC):
  «3,98% Rendimiento neto actual».
- `https://www.spiko.io/es/spiko-euro` (08:46:12 UTC): «2,84% * Rendimiento
  neto actual».
- `https://data.spiko.io/eutbl/`, `/ustbl/` y `/safo-eur/` (08:46:11 UTC):
  2.40 %, 3.98 % y 2.84 %, con «Latest NAV … 2026-11-12».
- AMF GECO, `https://geco.amf-france.org/back-office/funds/lastVl/FR001400ODL1`
  (08:48:23 UTC): `valuationDate 2026-11-12`, `1.0628 EUR`.
- AMF GECO, `…/lastVl/FR001400ODM9`: `1.10269 USD`.
- AMF GECO, Spiko Euro (`…/FR0014015LD3`): respuesta vacía; sus clases salen
  `[]`.

**Avisos que siguen vigentes** (los mismos textos de la web hoy):

- Spiko Euro: «Interés a tipo fijo 2,84% Garantizado por contrapartes» y
  «Sociedad gestora Amundi Asset Management».
- Página de particulares: «No existen límites de retirada».
- Letras Dólar: «sin preaviso y sin límite de importe».

**Documentos y registros, iguales:**

- KID en español EUTBL `cb1a621d…`, USTBL `c1ce5400…` y eurSAFO `53effea2…`
  (08:46:45 UTC): el mismo SHA-256 que el 12/11.
- El folleto en español sigue en 403.
- La CNMV muestra SPIKO SICAV n.º 2380, inscrita el 30/01/2026, SICAV,
  Francia (08:47:09 UTC).

**Lo que falla (corrección obligatoria):**

- `https://docs.spiko.io/documentation/product_overview/fund_availability`
  (08:48:05 UTC) dice:
  - «Last updated: November 6, 2026»;
  - «🇪🇸 Spain ✅ ✅ ✅ ❌» (columnas Smart Cash, T-Bills Euro, T-Bills Dollar
    y T-Bills Pound).
- La copia del 12/11 a las 00:33 UTC decía «October 23, 2026». La del propio
  investigador de hoy (08:31 UTC) ya dice «November 6, 2026».
- Aun así, el claim `accesoEspana` de las tres fichas tiene como literal
  «Last updated: October 23, 2026», con `fechaDato` 2026-10-23 y
  `consultadoUtc` del 13/11. El literal no coincide con lo que decía la
  fuente a esa hora.
- España sigue marcada, así que el acceso no cambia.
- Detalle menor: la nota del expediente dice que España está marcada «en las
  cuatro columnas». Está en tres de cuatro: en «T-Bills Pound» tiene ❌.

**Matices que no bloquean:**

- data.spiko.io llama a la cifra «30d yield», y la web en español, «últimos
  31 días».
- En el fondo en dólares, la ventana real es de 30 días (por el festivo). La
  tarjeta cita el «31 días» de la propia Spiko: es correcto como cita, pero
  conviene saberlo.
- Si la entrega se monta después de las 18:00 UTC (letras) o de las 19:30 UTC
  (Spiko Euro), habrá VL del 13/11. Las cifras de hoy siguen siendo ciertas
  con su fecha (VL del 12/11), pero ya no serán las últimas.

**Los tres textos de la tarjeta** (`resumenTarjeta`) no cambian frente a ayer:

- miden entre 9 y 116 caracteres (todos ≤ 120);
- están en castellano llano;
- se apoyan en el KID, el folleto y la tabla de países;
- en Spiko Euro siguen diciendo que ningún registro público confirma el fondo
  en España.

## mTBILL (sin cambios: confirmado)

**Oráculo en Ethereum** (`https://ethereum-rpc.publicnode.com`, `eth_call`
al oráculo `0x0563…2E5b`, 08:45:38 UTC, bloque 26.404.934):

- `latestRoundData` sigue siendo la **ronda 492: 1,07768132 USD, del
  10/11/2026 a las 18:40:23 UTC**. No hay ronda del 11/11 ni del 12/11.
- He leído las rondas 462–492:
  - la 468 es del martes 06/10, a las 14:16:11 UTC (1,07410723 USD);
  - de la 468 a la 492 hay 35,183 días: **3,452 %** anual simple;
  - la cifra publicada, 3,45 %, se sostiene;
  - la ventana no toca ningún festivo: la 471 es del 09/10 y la 472, del
    martes 13/10, después del Columbus Day.

**Bóveda de reembolso inmediato** (08:46:01 UTC):

- `paused()` = 0;
- comisión `instantFee` = 7 (0,07 %);
- mínimo `minAmount` = 1 mTBILL;
- USDC en el contrato de Superstate: 6.224.405,45.

**Conflicto de reembolso** (08:46:11 UTC), el mismo de antes:

- Condiciones Finales (SHA-256 `b1e58001…`): «Redemption Gates 25% of the
  aggregate number of outstanding mTokens», «Minimum Investment Amount not
  applicable» y «Offer(s) to the Public Spain, …».
- KID en español (`6c228709…`): «no reembolsará más del 15 %».
- Mismos archivos que el 12/11. El estado `fuentes_en_conflicto` sigue siendo
  correcto.

**Registros:**

- CNMV, pasaportes (08:47:09 UTC): «Midas Software GmbH LIECHTENSTEIN BPWO-84
  17/07/2026».
- `midas.app/mtbill` y `docs.midas.app` dan **403** (08:46:02 UTC). No he
  insistido.

**Tarjeta propuesta:** es idéntica a la publicada (métricas, avisos,
`rentabilidad: null` y los tres textos).

## Robinhood (sin cambios: confirmado)

- **Los seis PDF tienen el mismo SHA-256 que el 12/11** (08:46:45 UTC): KID en
  inglés `d744e3ac…`, KID en español `84f4f0a8…`, tarifas `614b0f5b…`,
  descripción de servicios en inglés `4e3ab0a2…` y en español `75f905ae…`, y
  términos `5993f856…`.
- **`https://robinhood.com/eu/es/invest`** (08:48:33 UTC):
  - el texto visible es idéntico al del investigador y al del 12/11;
  - dice «Classic Stock Tokens son contratos derivados entre tú y Robinhood»
    y «más de 2.000 Classic Stock Tokens».
- **CNMV** (08:47:09 UTC): ROBINHOOD EUROPE, UAB, n.º 5299, 21/04/2025,
  Lituania.

## Kraken xStocks (sin cambios en la tarjeta: confirmado)

- **Condiciones finales nuevas**, en
  `https://sppdownloaddocumentservice.l-p-a.com/api/DownloadDocument/UPI/CH1588667225/BF%20Final%20Terms%20AND%20Summary%20(PDF)`
  (08:46:46 UTC, SHA-256 `5297cd90…`):
  - dicen «Xetra-Gold xStock 4GLDx», «dated November 9th, 2026»;
  - y «The Products will be offered in Liechtenstein and Switzerland (only to
    Swiss Professional Investors)».
  - España solo figura entre los países donde se notificó el folleto.
  - El aviso publicado sigue siendo cierto.
- **ESMA (Solr)** (08:47:00 UTC): un documento FTWS para CH1588667225,
  aprobado el 2026-11-10.
- **Documentos del emisor:** el folleto (`47be9272…`) y el segundo suplemento
  (`acb0376b…`) son iguales que el 12/11.
- **KID en español de CH1436219716** (08:51:33 UTC): «Este documento tiene
  fecha 12 nov. 2026» y «clase de riesgo 5 en una escala de 7». Confirma que
  se regeneraron sin cambiar la clase.
- **Páginas de Kraken:**
  - `eu.kraken.com/xstocks` dice «Start with as little as €1 EUR».
  - Su texto es igual al del investigador, y el de `eu.kraken.com/es/xstocks`
    (pedido en español), igual al del 12/11.
- **CNMV** (08:47:09 UTC): PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED,
  n.º 4474, Chipre.

## Prosegur Digital Gold (sin cambios: confirmado)

Lo he abierto con Playwright, en español (es-ES), entre las 08:49:07 y las
08:49:27 UTC.

- **Contrato**
  (`https://app.prosegurdigitalgold.com/#/terms-service`):
  - «Actualizado el 08/07/2026», «Precio LBMA diario + 4%» y «Precio LBMA
    diario - 6%»;
  - «en un plazo de 1 a 7 días hábiles aproximadamente»;
  - el texto es idéntico al del investigador.
- **Web** (`https://www.prosegurcrypto.com/digital-gold`):
  - «Compra mínima ✔ 1 gramo».
  - Respecto a la copia del investigador, solo cambian el precio del oro de
    la cabecera y los dos nombres que él recortó.
- **App:** «Precio de compra 117.96 €». No va en la tarjeta.
- **Registros:** la relación de proveedores de criptoactivos de la CNMV
  (`188c6935…`) y el CASPS.csv de ESMA (`e0a73cab…`) son los mismos archivos
  que el 12/11.

## Advertencias de la CNMV

Lo he consultado en
`https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=<nombre>`, entre
las 08:47:17 y las 08:47:46 UTC.

- Dan «No hay datos disponibles» para: Spiko, Twenty First Capital, Amundi,
  Aldana, Midas, Midas Software, Robinhood, Kraken, Payward, Backed, xStocks,
  Prosegur y Prosegur Custodia.
- La búsqueda de control «Trading» devuelve advertencias («Página 1 de 16»).

## Nombres y datos personales

- He revisado lo que entraría en Git del grupo: `grupos/principales/` sin
  `crudo/`, sin PDF y sin HTML, y los siete expedientes.
- Los testimonios de Spiko y la nota de prensa de Prosegur llevan
  «[nombre recortado]».
- El extracto de las condiciones finales de 4GLDx no trae nombres de
  administradores.
- En el CSV de ESMA solo hay direcciones de empresas (calle «Dr. Grass-Strasse»).
- No he encontrado nombres de personas físicas ni datos personales.
- El aviso del investigador sobre el `.gitignore` ya está resuelto: la carpeta
  del ciclo lo tiene desde las 08:40 UTC, y `crudo/`, `*.pdf` y `*.html`
  quedan fuera.
- En mi copia de la página de Prosegur también he recortado los dos nombres.

## Bloqueos

- `midas.app` y `docs.midas.app` dan 403 (08:46:02 UTC). No he insistido. Sin
  APY oficial del emisor.
- El folleto en español de Spiko da 403 (08:46:45 UTC).
- Spiko publica VL nuevas hoy a las 18:00 UTC (letras) y a las 19:30 UTC
  (Spiko Euro).

## Correcciones obligatorias

1. **Las tres fichas de Spiko** (`spiko-letras-del-tesoro-euro`,
   `spiko-letras-del-tesoro-dolar` y `spiko-smart-cash-euro`), en el claim
   `accesoEspana`:
   - el literal pasa de «Last updated: October 23, 2026» a «Last updated:
     November 6, 2026»;
   - `fechaDato` pasa de 2026-10-23 a 2026-11-06.
2. **En `documentacion-ofertas.json`**, en la referencia «Acceso desde
   España» que se vuelve a fechar el 13/11 de esas tres fichas:
   - `fechaDato` pasa de 2026-10-23 a 2026-11-06;
   - en Spiko Euro, el alcance «Tabla de disponibilidad de Spiko
     (23/10/2026)» pasa a «(06/11/2026)».
   - Las referencias históricas marcadas «· consulta 01/11/2026» se quedan
     como están.
3. **Nota interna** (no publicada): cambiar «en las cuatro columnas» por «en
   tres de las cuatro columnas (Smart Cash, T-Bills Euro y T-Bills Dollar)».

Las cifras propuestas (2,40 %, 3,98 % en USD, 2,84 % con VL del 12/11 y
3,45 % de mTBILL) y los «mantener» quedan confirmados tal como están.

## Archivos

- Este informe:
  `rwadar-app/data/verificaciones/2026-11-13-v2/revision-independiente/principales.md`
- Extractos sin nombres:
  `revision-independiente/fuentes/principales/extractos-principales.txt`
- Inventario con URL, hora, bytes y SHA-256 de 78 archivos:
  `revision-independiente/fuentes/principales/inventario-consultas-revisor.json`
- Copias completas (fuera de Git):
  `revision-independiente/fuentes/principales/crudo/`
