# Revisión independiente · grupo «principales» · 12/11/2026

Revisor independiente: no preparé estos expedientes. He abierto yo mismo las
fuentes primarias entre las **00:50 y las 00:58 UTC del 12/11/2026**. Solo
he usado páginas, documentos, API y registros públicos, y lecturas en cadena
de solo lectura. No he iniciado sesión, no he usado ninguna wallet y no he
intentado sortear ningún bloqueo.

## Veredicto en una frase

**Aprobado con cambios.** Todo lo que dice el investigador es cierto, salvo
una cosa: **la rentabilidad de mTBILL no debe salir como 3,53 %**. Las cifras
del oráculo son exactas, pero esa ventana empieza el día después de un festivo
en EE. UU. y sale inflada. Con cualquier otra ventana de martes a martes, de 3
a 15 semanas, sale entre **3,38 % y 3,47 %**. La corrección es obligatoria
(ver abajo).

| Ficha | Propuesta | Mi veredicto |
|---|---|---|
| Spiko Letras del Tesoro Euro | mantener | confirmado (muestreo) |
| Spiko Letras del Tesoro Dólar | mantener | confirmado (muestreo) |
| Spiko Euro (Smart Cash) | actualizar (fecha y explicación) | confirmado |
| mTBILL · cifra de rentabilidad 3,53 % | actualizar | **rechazado como está**; corrección obligatoria |
| mTBILL · neto de comisiones (KID) y aviso nuevo | actualizar | confirmado con cambios |
| mTBILL · valor por token, conflicto de reembolso y textos de la tarjeta | mantener | confirmado |
| Robinhood Classic Stock Tokens | mantener | confirmado (muestreo) |
| Kraken xStocks | mantener | confirmado (muestreo parcial) |
| Prosegur Digital Gold | mantener | confirmado (muestreo) |

## 1. mTBILL: la cifra de rentabilidad (corrección obligatoria)

**Lo que he comprobado (en cadena, 00:51 y 00:53 UTC).** He leído el oráculo
`0x056339C044055819E8Db84E71f5f2E1F536b2E5b` por
`https://ethereum-rpc.publicnode.com`, rondas 420 a 492:

- La última ronda es la **492**, del **martes 10/11/2026 a las 18:40 UTC**, con
  **1,07768132 USD**. El 11/11 no hay ronda.
- La ronda **472** es del **martes 13/10/2026 a las 13:43 UTC**, con
  **1,07474744 USD**.
- Con esas dos rondas sale **3,533 % simple** y **3,591 % compuesta**, en
  28,206 días. La cuenta del investigador es correcta.

**Por qué esa ventana infla la cifra.** El oráculo apunta casi un día de
intereses en cada ronda. Los miércoles apunta unos tres, porque recoge el fin
de semana. El lunes 12/10 fue festivo en EE. UU. y no hubo ronda. Por eso el
valor del martes 13/10 lleva **un día menos** de intereses que un martes
normal:

- un martes normal suma unas 2 unidades desde el viernes (+1,04 y +1,08 el
  05–06/10);
- el 13/10 solo sumó +1,02;
- el atraso se recuperó el jueves 15/10, con +3,81.

Una ventana que empieza ese día cuenta unos 29 días de intereses en 28 días
de calendario. Eso explica el salto. La tabla de mi lectura, siempre de un
martes al martes 10/11, a ritmo anual simple:

| Desde | Días | Rentabilidad |
|---|---|---|
| 28/07 | 105,2 | 3,43 % |
| 11/08 | 91,3 | 3,39 % |
| 01/09 | 70,3 | 3,43 % |
| 15/09 | 56,2 | 3,42 % |
| 29/09 | 42,1 | 3,45 % |
| **06/10** | **35,2** | **3,45 %** |
| **13/10 (la propuesta)** | **28,2** | **3,53 %** ← la única que se sale |
| 20/10 | 21,3 | 3,39 % |

Otras ventanas con los dos extremos normales y del mismo día de la semana:

- de viernes a viernes, del 09/10 al 06/11: 3,41 %;
- de jueves a jueves, del 08/10 al 05/11: 3,41 %;
- de lunes a lunes, del 05/10 al 09/11: 3,46 %.

El contraste que cita el propio investigador (rwa.xyz, 3,44 % a 30 días)
encaja con 3,4 %, no con 3,53 %. Publicar 3,53 % sería escoger la ventana más
alta, y las reglas lo prohíben («no elijas la cifra más atractiva»).

**Corrección obligatoria.** No publicar 3,53 %. Hay dos opciones:

- **A (recomendada).** Publicar **3,45 % anual en USD**, la ventana limpia más
  cercana a 30 días. Va de la ronda 468 (**martes 06/10/2026, 14:16 UTC,
  1,07410723 USD**) a la 492 (**martes 10/11/2026, 18:40 UTC, 1,07768132
  USD**): 35,18 días, 3,452 % simple y 3,506 % compuesta.
  - Métrica: «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD:
    3,45 % anual».
  - El literal de `rentabilidad` cambia «entre el 13/10/2026 (1,07474744
    USD) y el 10/11/2026 (1,07768132 USD), 4 semanas» por «entre el
    06/10/2026 (1,07410723 USD) y el 10/11/2026 (1,07768132 USD), 5
    semanas».
  - El bloqueo del expediente que dice «3,53 % a 4 semanas» se corrige igual.
- **B.** Dejar `rentabilidad` en `null` un día más.

Tal como está, «3,53 %», queda rechazado.

## 2. mTBILL: el resto del expediente

- **KID en español** (CDN de GitBook, 00:52:07 UTC, HTTP 200). SHA-256
  `6c22870917cda81e…87da545`, igual que ayer y que ACCESO-FUENTES. Literales
  comprobados:
  - p. 1: el VL va «calculado por el Agente de Cálculo, tras deducir todas
    las comisiones, costes y deducciones aplicables»;
  - p. 1: «El VL por Producto se publica en https://midas.app/mtbill y a
    través de oráculos on-chain»;
  - p. 3: la comisión de rendimiento es del «5 % de la rentabilidad positiva
    del mToken, deducido dentro del VL»;
  - p. 3: costes de entrada, «No cobramos comisión de entrada»;
  - p. 3: costes de salida, «0,07 % … solo se aplica al reembolso
    inmediato»;
  - p. 4: «no reembolsará más del 15 %» y «podrá retenerse hasta el 50 %».

  Se puede decir que el valor ya va neto de la comisión del 5 %.
- **El oráculo es el del producto** (en cadena, 00:52:40 UTC). Lo he
  comprobado así:
  - la bóveda `0x569D…f0Ec` → `mTokenDataFeed()` da `0xfcee9754…734a2b`;
  - `aggregator()` da `0x056339c0…2e5b`;
  - `description()` da «mTBILL/USD»;
  - la bóveda no está en pausa (`paused()` = 0) y `instantFee()` = 7 (0,07 %).
- **Condiciones Finales** (CDN de GitBook, 00:52:07 UTC). SHA-256
  `b1e58001ec0f688a…3944a`, el mismo de siempre. Dicen:
  - «Minimum Investment Amount not applicable»;
  - «Redemption Gates 25% …» y «Holdback Percentage up to 5%»;
  - en «Offer(s) to the Public», España;
  - «Prohibition of Sales to [EEA retail]… not applicable».

  El conflicto 25 %/5 % frente a 15 %/50 % sigue: el estado debe seguir en
  `fuentes_en_conflicto`.
- **Registros (00:52:07 UTC).**
  - ESMA: 41 documentos del emisor por LEI (el último, un FTWS del
    26/10/2026) y 3 del ISIN CH1371002986.
  - CNMV, pasaportes: BPWO-84 (17/07/2026), BPWO-63 y BPWO-45 de Midas
    Software GmbH, Liechtenstein.
  - Advertencias de la CNMV para «Midas»: «No hay datos disponibles». El
    control con «Gemini» devuelve GEMINI LTD FX y GEMINI OPTION LTD, así que
    la búsqueda funciona.
- **midas.app/mtbill**: HTTP 403 a las 00:52:07 UTC. Confirma el bloqueo; no
  he insistido.
- **El aviso nuevo es correcto:** dice que la cifra es pasada, en dólares y
  sin el 0,07 % ni el cambio euro/dólar. Con la corrección A sigue valiendo
  igual. Mejora optativa: añadir «calculada del 06/10 al 10/11/2026» para que
  el aviso lleve la ventana.
- **Textos de `resumenTarjeta`** (no cambian):
  - mínimo, 41 caracteres;
  - acceso desde España, 46 caracteres;
  - salida, 107 caracteres.

  Los tres están en castellano llano, por debajo de 120 caracteres y
  respaldados por las Condiciones Finales y el KID.
- **Observación (no bloquea).** En `documentacion-ofertas.json` del 11/11,
  mTBILL aún lleva dos referencias antiguas de midas.app: «APY observado
  3,41 %», consultada el 21/09, y «3,42 % · 7D APY», consultada el 30/09. Si
  se publica la cifra nueva, conviene retirarlas o comprobar que no se ven al
  lado, para que la ficha no enseñe tres rentabilidades.

## 3. Spiko Euro (Smart Cash): confirmado

- **API pública (00:50:49 UTC).**
  - `https://public-api.spiko.io/v0/share-classes/eurSAFO/yield`:
    `dailyYield`, `weeklyYield` y `monthlyYield` valen las tres «0.0284».
  - `/totals`: VL **1,017029 EUR** del **11/11/2026**, calculada el 11/11 a
    las 16:26:51 UTC, y 11.142 titulares.
  - La próxima cifra llega a las 19:30 UTC de hoy (`nextYieldTimestamp`
    1794511800).
- **Web** (`https://www.spiko.io/es/spiko-euro`, 00:52:07 UTC, y la versión
  dibujada en el navegador a las 00:56:12 UTC). Dice «Interés a tipo fijo
  2,84%» y «*Tipo neto de comisiones abonado diariamente por la contraparte
  bancaria (BNP Paribas)». El literal nuevo que se propone lo describe bien.
- **Recálculo propio** con la serie de VL (`/totals/from-day`, 00:52:07 UTC),
  a ritmo simple:
  - 1 día, 2,76 %;
  - 7 días, 2,79 %;
  - 28 días, 2,80 %.

  El investigador da 2,80 % y 2,83 %, que salen capitalizando. En los dos
  casos la cifra publicada (2,84 %) no es «lo que creció el fondo», así que el
  cambio de explicación está justificado. Corrección menor, solo en el
  expediente: si se citan esas cifras, decir que son capitalizadas.
- **Textos de `resumenTarjeta`:**
  - mínimo, «Desde 1 €» (9 caracteres);
  - acceso desde España, 108 caracteres;
  - salida, 116 caracteres.

  Los tres son llanos, de 120 caracteres o menos, y coinciden con la ficha de
  ayer. Los cinco avisos de contenido siguen siendo ciertos: la web sigue
  diciendo «Interés a tipo fijo», «Garantizado por contrapartes» y «Sociedad
  gestora Amundi Asset Management».
- Advertencias de la CNMV para «Spiko»: «No hay datos disponibles» (00:52:07
  UTC).

## 4. Fichas «sin cambios» comprobadas por muestreo

- **Spiko Letras del Tesoro Euro.** La API, a las 00:50:50 UTC, da
  `monthlyYield` «0.0241» y la VL 1,062738 EUR del 11/11. Los SHA-256
  coinciden con los del investigador, y él los marca iguales a los del 11/11:
  - `yield`, `9cc1e1bed0f4e10b…`;
  - `totals`, `9dddb3cd20b012bc…`.

  La web, dibujada en el navegador a las 00:56:02 UTC, dice «2,41% Rendimiento
  neto actual». La HTML dice «Depósito inicial mínimo €1». Mantener.
- **Spiko Letras del Tesoro Dólar.** La API, a las 00:50:50 UTC, da
  `monthlyYield` «0.0402» y la VL 1,102496 USD del 10/11. Los SHA-256
  coinciden:
  - `yield`, `1bbc7629f573156d…`;
  - `totals`, `5ddfe79761dd85b4…`.

  La web, a las 00:56:07 UTC, dice «4,02%»; la HTML, «Depósito inicial mínimo
  $1». La próxima VL de las dos llega hoy a las 18:00 UTC. Mantener.
- **Robinhood.** A las 00:54:04 UTC, el KID en español (`84f4f0a8…`), la
  tabla de comisiones (`614b0f5b…`) y la descripción de servicios en español
  (`75f905ae…`) tienen el mismo SHA-256 que ayer. La tabla dice «0.10%
  currency conversion fee» y el KID, «clase de riesgo 7» y «1 año». En la
  CNMV, «Robinhood» no tiene advertencias. Mantener.
- **Prosegur Digital Gold.** Lo he dibujado en el navegador, en es-ES, a las
  00:54:32 UTC:
  - el contrato dice «Actualizado el 08/07/2026», «Precio LBMA diario + 4%»
    y «Precio LBMA diario - 6%»;
  - la web dice «Compra mínima ✔ 1 gramo».

  En la CNMV, «Prosegur» no tiene advertencias. Mantener.
- **Kraken xStocks** (muestreo parcial, 00:57:30 UTC):
  - las Condiciones Finales n.º 159 (`85b56d11…`) y el segundo suplemento del
    29/09/2026 en la MFSA (`acb0376b…`) tienen el mismo SHA-256 que ayer;
  - las Condiciones Finales siguen diciendo «offered in Liechtenstein and
    Switzerland»;
  - ESMA tiene 1.730 documentos del emisor;
  - en la CNMV, «Kraken» no tiene advertencias.

  No he vuelto a abrir las páginas de Kraken UE ni la ayuda global, la
  novedad no crítica que cita el investigador. Mantener.

## 5. Datos personales

- En `grupos/principales/fuentes/` (fuera de `crudo/`) no he encontrado
  nombres de personas físicas. Las dos que había, el testimonio de Spiko y la
  nota de prensa de Prosegur, salen como «[nombre recortado]».
- Mis copias tampoco llevan nombres. He borrado lo que podía llevarlos: las
  HTML en bruto, el PDF firmado de las Condiciones Finales y el texto completo
  de Prosegur. Dejo solo fragmentos en `extractos.json`. La huella de cada
  descarga original está en `inventario-revision.json`.

## Bloqueos

- `midas.app/mtbill`: 403 a las 00:52:07 UTC. No he podido leer el APY
  oficial del emisor.
- No he dibujado la tabla de reembolso de la web de Midas, la tercera cifra
  del 11/11, porque también da 403.

## Correcciones obligatorias

1. **mTBILL:** no publicar 3,53 %. Hay que elegir una de estas dos:
   - publicar **3,45 %** (ventana del 06/10/2026 al 10/11/2026, rondas 468 a
     492, con la métrica y el literal del apartado 1);
   - dejar `rentabilidad` en `null`.

## Archivos

Copias en `revision-independiente/fuentes/principales/`:

- respuestas de la API de Spiko;
- rondas del oráculo y lectura de la bóveda;
- KID de mTBILL y PDF de Robinhood, con su texto;
- respuestas de ESMA;
- `extractos.json`;
- `inventario-revision.json` (35 consultas con URL, código HTTP, hora UTC,
  bytes y SHA-256).
