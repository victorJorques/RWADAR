# Auditoría independiente · ámbito «spiko» · 20/11/2026

Fichas: `spiko-letras-del-tesoro-euro`, `spiko-letras-del-tesoro-dolar` y
`spiko-smart-cash-euro`. Auditor independiente: no investigué ni monté estas
fichas. Abrí yo mismo todas las fuentes entre las 17:14 y las 17:22 UTC, con
peticiones normales (curl con su agente por defecto, sin cuentas ni trucos).
Copias de trabajo fuera del repositorio, en `/tmp/auditoria-2026-11-20/spiko/`.

Lo auditado es lo publicado el 13/11 (`2026-11-13-v2/escaparate-publicacion.json`
y `documentacion-ofertas.json`) con los cambios de `DECISIONES-COORDINADOR.md`
§2 y §4, los textos de `expedientes/` y las correcciones de
`revision-independiente/spiko.md`. También miré cómo el motor
(`.claude/skills/investigacion-catalogo/entrega/preparar.mjs`) re-fecha las
referencias de la tarjeta y cómo la web las filtra
(`rwadar-site/assets/ficha-editorial-20261022.js` y `rwadar-20260820.js`).

## Resultado en una frase

Las dos cifras de las Letras **ya están viejas**: Spiko publicó la VL del 20/11
a las **17:18 UTC** (no a las 18:00). Euro pasa de 2,35 % a **2,45 %** y Dólar
de 3,97 % a **4,00 %**. Además, la fecha de la tabla de países de Spiko que
se enseña en «Acceso desde España» está mal en las tres fichas, y a la ficha
de Spiko Euro le falta el texto exacto de la referencia «Aprobación del
compartimento». Todo lo demás se sostiene hoy en su fuente.

## Hallazgos obligatorios

### 1. Letras del Tesoro Euro: rentabilidad 2,35 % → 2,45 % (VL nueva)

- API pública, 17:20:46 y 17:21:03 UTC:
  <https://public-api.spiko.io/v0/share-classes/EUTBL/yield> →
  `"monthlyYield":"0.0245"`, `"updatedAt":"2026-11-20T17:18:23.527Z"`
  (SHA-256 `02a03185…`).
- <https://public-api.spiko.io/v0/net-asset-values/EUTBL/latest> →
  `"day":"2026-11-22T00:00:00.000Z"`, `"value":"1.063496"`,
  `"updatedAt":"2026-11-20T17:18:23.426Z"`. Ojo: Spiko fecha la VL del viernes
  con el domingo (cubre el fin de semana; igual que el 13/11, fechada el 15/11).
- Mi cálculo con la serie (`?startDay=2026-09-20`, 17:21 UTC): del 22/10
  (1,06131 €) al 22/11 (1,063496 €), 31 días, capitalizando: **2,452 %**.
  Cuadra con 2,45 %.
- La web ES y data.spiko.io seguían enseñando 2,35 % a las 17:22 UTC (página en
  caché). La fuente primaria es la API; hay que volver a mirar la web justo
  antes de publicar.
- **Corrección exacta:**
  - `rentabilidad.mostrada`: «2,45 %».
  - `rentabilidad.literal`: «Rendimiento neto anualizado de los últimos 31 días
    publicado por Spiko el 20/11/2026 (VL calculada el 20/11/2026, que Spiko
    fecha el 22/11/2026 porque cubre el fin de semana); consultado el
    20/11/2026. Variable y no garantizado.»
  - Métrica: «Rentabilidad publicada · 31 días · 20/11/2026» = «2,45 %».
  - Referencia «Rentabilidad publicada · 31 días»: valor «2,45 %»,
    `fechaDato` **2026-11-20** (no 22/11: la web descarta las referencias con
    fecha del dato posterior a la consulta), `fechaConsulta` 2026-11-20,
    alcance «Rendimiento neto anualizado de 31 días que publica Spiko (valor
    liquidativo calculado el 20/11/2026, que Spiko fecha el 22/11/2026;
    consultado el 20/11/2026 y recalculado ese día con los valores
    liquidativos fechados el 22/10 y el 22/11: 1,06131 € → 1,063496 €).
    Variable y no garantizado.» No dejar el alcance viejo (12/10 → 12/11).

### 2. Letras del Tesoro Dólar: rentabilidad 3,97 % → 4,00 % en USD

- <https://public-api.spiko.io/v0/share-classes/USTBL/yield>, 17:20:46 y
  17:21:03 UTC → `"monthlyYield":"0.04"`,
  `"updatedAt":"2026-11-20T17:18:10.697Z"` (SHA-256 `859689c2…`).
- VL: `"day":"2026-11-20T00:00:00.000Z"`, `"value":"1.103573"` (USD).
- Mi cálculo: del 20/10 (1,099901 $) al 20/11 (1,103573 $), 31 días,
  capitalizando: **4,002 %**.
- **Corrección exacta:**
  - `rentabilidad.mostrada`: «4,00 %».
  - `rentabilidad.literal`: «Rendimiento neto anualizado en dólares de los
    últimos 31 días publicado por Spiko el 20/11/2026 (VL del 20/11/2026);
    consultado el 20/11/2026. No incluye la variación del euro frente al
    dólar. Variable y no garantizado.»
  - Métrica: «Rentabilidad publicada · 31 días · 20/11/2026 · en USD» =
    «4,00 %».
  - Referencia «Rentabilidad publicada · 31 días»: valor «4,00 %», `fechaDato`
    y `fechaConsulta` 2026-11-20, alcance «Rendimiento neto anualizado en
    dólares de 31 días que publica Spiko (valor liquidativo del 20/11/2026,
    consultado el 20/11/2026 y recalculado ese día con los valores
    liquidativos del 20/10 y del 20/11: 1,099901 $ → 1,103573 $). No incluye
    la variación del euro frente al dólar. Variable y no garantizado.»

Spiko Euro (Smart Cash) no cambia: a las 17:21:03 UTC la API sigue en
`"dailyYield":"0.0284"` con la VL del 20/11 (1,017886 €, calculada a las
16:37:37 UTC); la siguiente llega el lunes 23/11 a las 19:30 UTC
(`nextYieldTimestamp 1795462200`). Mi cálculo a 7 días (13/11 → 20/11):
2,837 %. Correcto.

### 3. «Acceso desde España» (las tres fichas): fecha del dato vieja

- El motor re-fecha la referencia «Acceso desde España» con consulta de hoy,
  pero conserva su `fechaDato` 2026-11-06 (y en Spiko Euro el alcance dice
  «Tabla de disponibilidad de Spiko (06/11/2026)»). La ficha enseña «Dato
  fechado: 06/11/2026 · Consulta: 20/11/2026».
- La fuente, <https://docs.spiko.io/documentation/product_overview/fund_availability>
  (17:15:43 UTC, SHA-256 `179ef546…`), dice hoy «🇪🇸 Spain | ✅ | ✅ | ✅ | ❌»
  y «Last updated: November 13, 2026.». Los propios expedientes ya ponen
  `fechaDato 2026-11-13` en su claim, pero la decisión no lo lleva a
  `documentacion-ofertas`.
- **Corrección exacta:** en las tres fichas, referencia «Acceso desde España»
  con `fechaDato` **2026-11-13**. En Spiko Euro, alcance: «Comprobado de nuevo
  en la fuente el 20/11/2026. Tabla de disponibilidad de Spiko (13/11/2026):
  España marcada en la columna Smart Cash, que cubre Spiko Euro. La CNMV no
  publica los compartimentos de los fondos extranjeros y la AMF ya no muestra
  la ficha del fondo: no consta en ningún supervisor.»

### 4. Spiko Euro: referencia «Aprobación del compartimento» y descripción

- La decisión solo dice «se quita la fecha 17/02/2026, «(ficha pública en GECO
  …)» y la URL c124199». No da el texto que queda. Si solo se quita la URL de
  `fuentes`, la referencia (que apunta a c124199) se queda con un alcance falso
  («autorizado el 17/02/2026 … Lo confirma el certificado de la AMF») o la web
  la esconde sin avisar.
- Hoy: <https://geco.amf-france.org/back-office/funds/compartment/c124199>
  (17:17:28 UTC) → `{"idInterne":0,…,"published":false}`. El certificado
  <https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf> (17:15:49 UTC,
  SHA-256 `709e0585…`, el mismo) dice «Paris, 2026-02-23» y
  «SCV20260075 SPIKO AMUNDI OVERNIGHT SWAP FUND», sin fecha de autorización
  del compartimento. El folleto de GECO 438274 (mismo SHA-256 `940559b4…`) no
  contiene «SCV20260075» ni «17/02/2026». El KID en español sí dice «Este
  compartimento está autorizado en Francia por la AMF».
- **Corrección exacta:**
  - Referencia «Aprobación del compartimento»: valor «N.º SCV20260075, en la
    lista de compartimentos del certificado de la AMF del 23/02/2026»,
    `fechaDato` 2026-02-23, `fechaConsulta` 2026-11-20, fuente
    `https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf`, alcance
    «Certificado de la AMF que aloja Spiko: incluye SPIKO AMUNDI OVERNIGHT SWAP
    FUND (SCV20260075) entre los compartimentos de Spiko SICAV. No da la fecha
    de autorización del compartimento ni dice en qué países se vende. El
    20/11/2026 la ficha del fondo ya no aparece en la base pública de la AMF
    (GECO).»
  - Descripción: cambiar «autorizado por la AMF el 17/02/2026 con el n.º
    SCV20260075 (ficha pública en GECO y certificado de la AMF del
    23/02/2026)» por «autorizado por la AMF con el n.º SCV20260075, según el
    certificado de la AMF del 23/02/2026».
  - Quitar `https://geco.amf-france.org/produit-d-epargne/c124199` de
    `fuentes`.
  - Métrica «Supervisor»: el texto corregido de la revisión (no el del
    expediente). Lo comprobé y se sostiene.

## Hallazgos recomendados

5. **«Supervisor» de las dos Letras.** Dice «AMF (fondo) · inscrito en la CNMV
   para su comercialización, n.º 2380». La CNMV (17:17:45 UTC) solo muestra
   «SPIKO SICAV · 2380 · 30/01/2026 · SICAV · FRANCIA», con las pestañas
   «Datos generales» y «Entidades comercializadoras», sin compartimentos. El
   n.º 2380 es de la SICAV. Texto propuesto: «AMF (fondo) · Spiko SICAV
   inscrita en la CNMV para su comercialización (n.º 2380); la CNMV no detalla
   sus fondos uno a uno». Así queda igual que en Spiko Euro.
6. **Riesgo de la cadena de bloques y de la cartera (las dos Letras).** El KID
   en español (17:15:49 UTC, mismo SHA-256) pone entre los «Riesgos
   importantes para el Producto no tenidos en cuenta en este indicador» los
   del registro en blockchain y los de la cartera digital, que pueden
   «provocar una pérdida total o parcial de la inversión». La tarjeta solo
   dice «Riesgo KID: 1 de 7». Texto propuesto para la métrica: «1 de 7, sin
   contar los riesgos de la tecnología blockchain y de la cartera digital (el
   KID los deja fuera)». En Dólar, añadir «, ni el riesgo de cambio».
7. **Dólar, mínimo si ingresas euros.** La API dice
   `"intermediaryShareClasses":[["EUR","62fb4d4d-…"]]` para USTBL. Esa clase
   (eurUSTBL, FR001400SBD3) tiene `"minimumInitialSubscription":"1000"`
   (17:15:24 UTC). La documentación (17:20:06 UTC) dice que los euros entran
   «through the intermediaryShareClasses mechanism». El folleto dice 1 EUR
   para esa clase. Es el conflicto que ya anota el expediente, pero la tarjeta
   no lo cuenta. Texto propuesto para el mínimo en la ficha: «Desde 1 dólar
   (clase USD). Si ingresas euros, la API de Spiko pone 1.000 € de mínimo
   inicial para esa vía y el folleto 1 €: confírmalo con Spiko.»

## Lo que comprobé y se sostiene (fuente abierta hoy)

| Dato visible | Fichas | Fuente y hora UTC | Resultado |
|---|---|---|---|
| Títulos, proveedor, botón «Ver fuente» (3 URL de spiko.io) | 3 | web ES, 17:15:43 (200) | Correcto |
| Resúmenes (UCITS, letras zona euro / EE. UU., €STR + margen, no monetario) | 3 | KID ES; API `referenceIndex` «€STR capitalizado + 0.50%» (17:15:24) | Correcto |
| Mínimo 1 EUR / 1 USD / 1 EUR | 3 | Folleto EN (`7457e79f…`, 17:15:49): FR001400ODL1 / ODM9 / 15LD3 = 1; API `minimumInitialSubscription "1"`; web «Depósito inicial mínimo €1 / $1» | Correcto, sin «por participación» |
| Moneda EUR / USD con depósito en EUR | 3 | docs «currency_exchange» (17:18:04): «When you deposit euros into a USD or GBP product, your funds are automatically converted» | Correcto |
| Gastos 0,25 %; entrada y salida 0 % | 2 Letras | KID ES p. 3 (`cb1a621d…`, `c1ce5400…`) | Correcto |
| Comisiones Spiko Euro 0,25 % + hasta 0,10 %; 0 % / 0 % | Smart Cash | Folleto GECO 438274 (`940559b4…`) P1 0,25 % TTC, P2 0,10 % TTC máx.; KID | Correcto |
| Reembolso diario, corte 11:30, límite 10 % | 2 Letras | KID ES; folleto: VL diaria salvo festivos de Francia o EE. UU. | Correcto |
| Reembolso 15:00, pago J+1, límite 25 %, 20 VL en 3 meses | Smart Cash | Folleto GECO §3.2.4; KID ES | Correcto |
| Riesgo KID 1 de 7 (+ cambio; + contraparte fuera; 3 meses) | 3 | KID ES | Correcto |
| Escenarios 9.980–10.100 € (moderado 9.990 €); swing pricing ≤ 0,50 % | Smart Cash | KID ES; folleto GECO | Correcto |
| Gestora Twenty First Capital, delegación en Amundi | Smart Cash | KID «Productor: TWENTY FIRST CAPITAL»; folleto «Délégataire de gestion financière: Amundi» | Correcto |
| Avisos web frente a KID («Interés a tipo fijo 2,84% Garantizado por contrapartes», «rendimiento diario garantizado», «Sociedad gestora Amundi Asset Management», «No existen límites de retirada», «sin preaviso y sin límite de importe») | Smart Cash, Dólar | web ES 17:15:43 | Siguen ahí: los avisos hacen falta |
| Supervisor Spiko Euro (texto corregido) | Smart Cash | certificado AMF 2026-02-23; GECO c124199 `published:false` (17:17:28); CNMV 2380 | Correcto |
| GECO c79399 y c79398: vivos, «Tous souscripteurs», SCV20240014 / 13 | 2 Letras | back-office GECO 17:17:28; lastVl 19/11 1,06328 € y 1,10345 $ | Correcto |
| CNMV SICAV n.º 2380 (30/01/2026) y Spiko Finance n.º 5325 (14/01/2026, RTO sobre IIC) | 3 | CNMV 17:17:45 | Correcto |
| Pasaporte de Spiko Finance hacia España desde 08/01/2026 | plataforma | API REGAFI 17:21:55: «Libre prestation de services · ESPAGNE · 2026-01-08» | Correcto |
| Advertencias CNMV: Spiko, Twenty First Capital, Aldana, Amundi | 3 | CNMV 17:18:37: «No hay datos disponibles» | Sin advertencias |
| PDF: KID EUTBL, KID USTBL, KID eurSAFO, folleto EN, términos, certificado AMF, folleto GECO | 3 | descargados 17:15:49 | Mismo SHA-256 que `vigia.json` |
| Reembolso inmediato hasta 500.000 € al día | Letras Euro | docs «deposits_withdrawals» 17:15:43 | Correcto |
| Enlaces de `fuentesActuales` y `fuentes` | 3 | todos 200 (docs.spiko.io redirige a la URL con barra final) | Correcto, salvo c124199 (vacía, ya decidida su retirada) |

En total abrí y comprobé hoy **99 datos visibles** de las tres fichas (32 de Letras Euro, 30 de Letras Dólar y 37 de Spiko Euro).

## Lo que no pude comprobar

- Folleto en español
  (<https://cdn.spiko.finance/legal_docs/ES/Prospectus_Spiko_SICAV_ES.pdf>):
  403 a las 17:15:49 UTC. No se reintenta. Usé el inglés y el francés (mismo
  SHA-256 que el vigía).
- El buscador de GECO (POST) no me respondió con una petición normal (400/500).
  No hace falta: la ficha c124199 da `published:false`.
- La web de Spiko y data.spiko.io seguían en caché con 2,35 % / 3,97 % a las
  17:22 UTC, aunque la API ya daba la VL del 20/11. Volver a mirarlas antes de
  publicar.
- La comercialización de Spiko Euro en España sigue sin confirmarse en un
  registro público (la CNMV no detalla compartimentos). El aviso publicado lo
  dice y sigue haciendo falta.
