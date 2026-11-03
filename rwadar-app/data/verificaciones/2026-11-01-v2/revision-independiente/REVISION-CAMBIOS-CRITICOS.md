# Revisión independiente · cambios críticos en ofertas publicadas

Ciclo 2026-11-01-v2 · revisión del 02/11/2026 (lecturas entre 16:26 y la hora
indicada en cada oferta, UTC real). Revisor: Claude, sin participación en la
investigación. Solo páginas y documentos públicos; sin login, KYC, formularios
ni wallets. Copias de lo leído en `revision-independiente/fuentes/`.

Alcance: las cinco ofertas publicadas con `decision: actualizar` y cambios
críticos. Se compara la `propuestaTarjeta` del expediente con la tarjeta
publicada en `2026-10-23-v2/escaparate-publicacion.json` y con la fuente
primaria releída hoy.

Veredictos posibles: **aprobada** · **aprobada_con_cambios** · **rechazada**.

---

## 1. spiko-letras-del-tesoro-euro · **aprobada_con_cambios**

### Hechos comprobados por mí

| Hecho | Fuente | Hora UTC | Lo que vi |
|---|---|---|---|
| Rentabilidad 31 días | `https://public-api.spiko.io/v0/share-classes/EUTBL/yield` | 2026-11-02T16:26:47Z | `"monthlyYield":"0.0235","updatedAt":"2026-10-30T16:02:10.069Z","nextYieldTimestamp":"1793642400"` (= 02/11/2026 18:00 UTC). También `dailyYield` y `weeklyYield` = 0.0246. |
| VL | `https://public-api.spiko.io/v0/net-asset-values/EUTBL/latest` | 2026-11-02T16:26:47Z | `"day":"2026-11-01","amount":{"value":"1.062032"}`, `updatedAt 2026-10-30T16:02:10Z`. |
| Recalculo propio | `https://public-api.spiko.io/v0/net-asset-values/EUTBL?startDay=2026-09-28&endDay=2026-11-03` | 2026-11-02T16:27:04Z | 1,059941 (01/10) → 1,062032 (01/11), 31 días: 2,348 % capitalizado (2,32 % simple). Coincide con 2,35 %. |
| Mínimo y costes en API | `https://public-api.spiko.io/v0/share-classes/EUTBL` | 2026-11-02T16:26:47Z | `minimumInitialSubscription "1"`, `subscriptionFees "0"`, `redemptionFees "0"`, `managementFees "0.0025"`, ISIN FR001400ODL1. |
| Web en español | `https://www.spiko.io/es/spiko-letras-del-tesoro-euro` | 2026-11-02T16:27:33Z | «2,35% Rendimiento neto actual» · «Rentabilidad neta de comisiones, calculada diariamente basándose en los últimos 31 días». También: «La liquidez diaria está garantizada contractualmente en el prospecto del fondo» y «€439 M». |
| Disponibilidad España | `https://docs.spiko.io/documentation/product_overview/fund_availability/` | 2026-11-02T16:27:15Z | «🇪🇸 Spain ✅ ✅ ✅ ❌» (columnas Smart Cash · T-Bills Euro · T-Bills Dollar · T-Bills Pound) · «Last updated: October 23, 2026». |
| Registro CNMV | `https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es` | 2026-11-02T16:27:22Z | «SPIKO SICAV · Nº Registro oficial 2380 · Fecha registro oficial 30/01/2026 · SICAV · FRANCIA · IIC Sujeto a la directiva 2009/65/CE». (La pestaña de comercializadoras no se abrió; ALDANA CAPITAL no consta en la vista general.) |
| KID ES | `https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf` (sha256 `cb1a621d…6373325`, idéntico al del expediente) | 2026-11-02T16:27:40Z | «Fecha de la última revisión … 01/09/2026» · «indicador de riesgo 1 sobre 7» · «Gastos de gestión y otros gastos administrativos u operativos 0,25 % … costes reales del último año» · «a más tardar a las 11:30 (hora de París)» · «mecanismo de limitación de los reembolsos … umbral del 10 % del patrimonio neto» · «El capital no está garantizado». |

### Discrepancias

- **Ninguna en la cifra**: 2,35 %, base 31 días, calculada el 30/10/2026 con la
  VL del 01/11, es exacta hoy a las 16:27 UTC. Pero caduca hoy: la API anuncia
  el siguiente cálculo para las **18:00 UTC del 02/11/2026**.
- La métrica «Comisión de gestión: 0,25 % anual (KID)» no es lo que dice el
  KID: el 0,25 % es «gastos de gestión **y otros gastos administrativos u
  operativos**» (coste corriente efectivo), no la comisión de gestión
  contractual (folleto: máx. 0,30 % + operativos máx. 0,10 %, según expediente).
- La web comercial dice «liquidez diaria garantizada contractualmente»; el KID
  prevé limitar reembolsos (umbral 10 %). La tarjeta ya lo avisa: correcto.
- La web muestra 439 M€ de patrimonio y la API (expediente) 444,52 M€: no va a
  la tarjeta; sin efecto.
- La disponibilidad en España descansa en la tabla del propio emisor (23/10),
  el registro CNMV de la SICAV y los Términos (consumidores). Suficiente para
  `disponibleEs: confirmado`, siempre condicionado a KYC y a no ser U.S. Person.

### Cambios obligatorios en la tarjeta

1. Renombrar la métrica «Comisión de gestión» a **«Gastos corrientes (KID)» ·
   «0,25 % anual»**.
2. En el momento de publicar, releer `…/EUTBL/yield`: si `updatedAt` ya no es
   30/10/2026, sustituir cifra y fecha (en `rentabilidad.literal` **y** en la
   métrica «Rentabilidad publicada · 31 días · …»); si no se puede releer,
   mantener 2,35 % con la fecha 30/10/2026 tal como está.
3. Precisar «Supervisor»: **«AMF (fondo) · inscrito en la CNMV para su
   comercialización, n.º 2380»** (la CNMV no supervisa el fondo, solo registra
   su comercialización).

Recomendado (no obligatorio): un aviso breve sobre la custodia digital («Las
acciones se registran en blockchain; perder el acceso a la cuenta o wallet
puede impedir operar», recogido en el KID como riesgo no incluido en el
indicador).

### Bloqueos

- No abrí la pestaña «Entidades comercializadoras» de la CNMV: no confirmo
  ALDANA CAPITAL (dato no crítico, no va a la tarjeta).
- Folleto en español no releído (el expediente registra 403).

---

## 2. prosegur-digital-gold · **aprobada_con_cambios**

### Hechos comprobados por mí

| Hecho | Fuente | Hora UTC | Lo que vi |
|---|---|---|---|
| Versión del contrato | `https://app.prosegurdigitalgold.com/#/terms-service` (renderizado con Chromium; texto en `fuentes/prosegur-terms.json`) | 2026-11-02T16:28:41Z | «TÉRMINOS Y CONDICIONES GENERALES \| PROSEGUR GOLD \| Actualizado el 08/07/2026» · CIF B88610126. |
| Sin supervisión del producto | ídem | 2026-11-02T16:28:41Z | «LOS TOKENS NO REPRESENTAN NINGÚN VALOR NEGOCIABLE … SOLO PUEDEN REVENDERSE A PROSEGUR CRYPTO … SU COMERCIALIZACIÓN NO ESTÁ SUJETA A LA SUPERVISIÓN DE NINGÚN REGULADOR FINANCIERO». |
| Diferencial | ídem, §5.4 | 2026-11-02T16:28:41Z | «Compra de tokens … Precio LBMA diario + 4% · Venta de tokens … Precio LBMA diario - 6%»; el cuadro «puede ser susceptible de cambio». |
| Plazo de recompra | ídem, §6.4 y §6.7 | 2026-11-02T16:28:41Z | «En condiciones normales, las órdenes de recompra se procesarán en un plazo de 1 a 7 días hábiles aproximadamente» · «En casos excepcionales … informará al Cliente del nuevo plazo estimado» · §6.7: puede «suspender temporalmente las operaciones de recompra» y «establecer montos máximos diarios o mensuales». |
| Red del token (contrato) | ídem, §2.1 | 2026-11-02T16:28:41Z | «emitidos sobre tecnología blockchain (Ethereum, estándar ERC-1155)». |
| Red del token (web) | `https://prosegurdigitalgold.com/transparency` | 2026-11-02T16:29:06Z | «Red blockchain Polygon (Ethereum-compatible layer 2) · Token standard ERC-3643 · Physical gold custody Prosegur Cash bunker». |
| Web comercial | `https://www.prosegurcrypto.com/digital-gold` | 2026-11-02T16:28:55Z | Sigue diciendo «Tiempo de liquidación ✔ Menos de 24 horas», «Liquidez sin restricciones», «Tarifas de custodia ✔ Sin tarifas», «Compra mínima ✔ 1 gramo», «ofrecemos oro prácticamente al valor de mercado» y «estrictos estándares regulatorios». |
| Autorización MiCA | `https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv` (sha256 `14d19dfd…a1f99`) | 2026-11-02T16:29:24Z | «Comision Nacional del Mercado de Valores (CNMV) · PROSEGUR CUSTODIA DE ACTIVOS DIGITALES S.L.U. · PROSEGUR CRYPTO · 30/06/2026 · a. custody and administration … \| g. reception and transmission of orders … \| j. transfer services … · Article 63». |

### Discrepancias

- **Web frente a contrato (confirmado hoy)**: la web promete «menos de 24
  horas», «liquidez sin restricciones» y precio «prácticamente al valor de
  mercado»; el contrato dice 1–7 días hábiles aproximados, posible suspensión y
  límites, y +4 % / −6 % sobre LBMA. La propuesta hace bien en seguir el
  contrato y no conservar «menos de 24 h».
- **Supervisión**: la autorización MiCA existe, pero cubre custodia, RTO y
  transferencia de criptoactivos; el contrato declara que el token de oro no
  está supervisado. La métrica «Producto no supervisado; entidad CASP MiCA
  (CNMV)» es correcta pero usa jerga y, puesta en una métrica, puede leerse
  como sello de supervisión.
- **Red del token**: Ethereum ERC-1155 (contrato) frente a Polygon ERC-3643
  (transparencia). No está en la tarjeta: correcto no publicar una red.
- **«Segregado en búnker de Prosegur Cash»**: el contrato habla de un
  inventario **fungible** (sin lingote asignado) en instalaciones de Prosegur
  Crypto «o de terceros custodios»; el búnker de Prosegur Cash solo lo dice la
  página de transparencia. «Segregado» a secas sugiere oro asignado.
- El mínimo de 1 gramo solo consta en la web comercial (no en el contrato):
  aceptable como dato del proveedor.

### Cambios obligatorios en la tarjeta

1. Métrica «Reembolso»: **«Solo recompra por Prosegur · 1–7 días hábiles aprox.
   en condiciones normales»** (el contrato dice «aproximadamente»).
2. Métrica «Custodia»: **«Oro en inventario común custodiado por Prosegur (sin
   lingote asignado)»**.
3. Métrica «Supervisión»: **«Producto no supervisado (según su contrato)»**, y
   llevar la autorización MiCA a un aviso con su alcance: «Prosegur Crypto está
   autorizada por la CNMV (MiCA, 30/06/2026) para custodiar y transferir
   criptoactivos; esa autorización no cubre este token de oro».
4. Aviso de coste en lenguaje llano y exacto: **«Si el oro no se mueve, comprar
   y revender te cuesta cerca de un 10 % (compras a LBMA +4 %, vendes a LBMA
   −6 %). Las comisiones pueden cambiar.»** (6/104 = 9,6 %; «10 puntos sobre
   LBMA» es menos claro).

Recomendado: añadir «Sin derecho de desistimiento» (según el expediente,
art. 103 TRLGDCU; no lo releí) y que la web promete liquidez en menos de 24 h
que el contrato no garantiza.

### Bloqueos

- Precio del gramo no capturado (carga por JavaScript tras login/consulta);
  correcto que la tarjeta no publique precio.
- No leí informe de auditoría ni póliza de seguro (la web anuncia auditorías
  mensuales: no publicable sin informe).

---

## 3. mtbill · **aprobada_con_cambios**

midas.app no se intentó (Cloudflare, ya documentado). Usé ESMA, los PDF
directos de GitBook y el oráculo en cadena.

### Hechos comprobados por mí

| Hecho | Fuente | Hora UTC | Lo que vi |
|---|---|---|---|
| Condiciones Finales vigentes | `https://registers.esma.europa.eu/solr/esma_registers_priii_documents/select?…issuer_lei:984500BB00BN6D2B7C48…` | 2026-11-02T16:30:14Z | `"national_document_id":"FTWS-1420","approval_filing_date":"2026-07-17","instrument_isins":"CH1371002986","document_languages":"… Spanish …"`; folleto base `BPWO-84` (17/07/2026). No hay Condiciones Finales posteriores para CH1371002986 (las de 26/10 y 30/09 son de otros ISIN). |
| Pasaporte a España | `https://registers.esma.europa.eu/solr/esma_registers_priii_securities/select?…` | 2026-11-02T16:30:22Z | `"sec_isin":"CH1371002986","sec_natDocId":"FTWS-1420","sec_homeMemberStateDesc":"LIECHTENSTEIN","sec_firstPassportingDate":"2026-07-17T14:44:13Z","sec_isPassportedFlag":"1","sec_prospectusId":"BPWO-84","sec_hostMemberStateList":"…,SPAIN,SWEDEN"`. |
| Final Terms (PDF) | GitBook `…uploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media` (sin token; sha256 `b1e58001…44a`, idéntico al expediente) | 2026-11-02T16:31:03Z | «Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, …» · «Prohibition of Sales to EEA Retail Investors: not applicable» · «Target market under MiFID II: eligible counterparties, professional clients and retail clients» · «Minimum Investment Amount not applicable» · «Instant Subscription Fee up to 0.2%» · «Redemption Fees up to 0.05%» · «Redemption Gates 25% of the aggregate number of outstanding mTokens per settlement day» · «Holdback Percentage up to 5%» · «Instant Redemption Fee 0.07%» · «Offer Period until end of validity of the Base Prospectus». |
| Patrimonio negativo | ídem, resumen | 2026-11-02T16:31:03Z | «… ended with a reported deficit not covered by equity of EUR 5’778’815.22. Liabilities to affiliated companies amounted to EUR 14’873’900.58 … two framework loans granted by the parent company, Midas Protocol Limited … subject to qualified subordination» (ejercicio 2025). |
| KID en español | GitBook `…uploads%2Fo0H3P2VXZM3GM2QeIOa2%2FKID_mTBILL%20es.pdf?alt=media` (sha256 `6c228709…a545`, idéntico) | 2026-11-02T16:31:03Z | «Fecha de revisión del DDF: 17 de julio de 2026» · «Midas Software GmbH no está autorizada ni supervisada … por la BaFin ni por ninguna otra autoridad» · «clase de riesgo 7 en una escala de 7» · «Podría perder toda su inversión» · «No cobramos comisión de entrada» · «Costes de salida 0,07 % … solo se aplica al reembolso inmediato (reembolso estándar: sin comisión)» · «Comisiones de gestión … 0,00 %» · «Comisiones de rendimiento 5 % de la rentabilidad positiva» · «no reembolsará más del 15 % … en ningún día de liquidación» · «podrá retenerse hasta el 50 % del importe» · «No existe un mercado de negociación … solo puede transmitirse a una persona cuya dirección de wallet haya sido incluida por el Emisor en la lista». |
| Valor por token | Ethereum, `eth_call` a `0x056339C044055819E8Db84E71f5f2E1F536b2E5b` (`latestRoundData`, `decimals`) vía `https://ethereum-rpc.publicnode.com` | 2026-11-02T16:31:17Z | ronda 486, `answer 107685452`, 8 decimales = **1,07685 USD**, `updatedAt 2026-11-02 13:20:23 UTC`. Es el oráculo que las Final Terms designan como «publication source for NAV per mToken». |

### Discrepancias

- **Valor por token desfasado**: la propuesta publica «1,0768 USD · 30/10/2026»
  (ronda 485); hoy el oráculo da **1,0769 USD a 02/11/2026** (ronda 486).
- **Conflicto FT/KID confirmado tal cual**: límite diario 25 % y retención ≤5 %
  (FT) frente a 15 % y ≤50 % (KID), ambos de 17/07/2026. El aviso de la
  propuesta lo recoge correctamente.
- **Comisiones FT/KID**: las FT permiten «Instant Subscription Fee up to 0.2%»
  y «Redemption Fees up to 0.05%»; el KID dice entrada 0 y reembolso estándar
  sin comisión. La métrica de la propuesta («0 % · éxito 5 %») es fiel al KID
  pero calla el 0,07 % del reembolso inmediato y los máximos de las FT.
- **Falta el patrimonio negativo en la tarjeta**: está en el expediente y en
  las FT, pero ninguno de los tres avisos lo menciona. Con un crédito
  subordinado y riesgo 7/7, es la información de riesgo más importante para un
  particular.
- **Pérdida total**: la métrica «riesgo 7 de 7» no basta; el KID dice
  literalmente «Podría perder toda su inversión».

### Cambios obligatorios en la tarjeta

1. Métrica de valor: **«Valor por token · 02/11/2026: 1,0769 USD (oráculo del
   emisor)»**, o releer el oráculo al publicar y poner valor y fecha de ese día.
2. Añadir aviso: **«El emisor cerró 2025 con patrimonio negativo (5,78 M€ de
   déficit) y se financia con préstamos de su matriz. Si no puede pagar, puedes
   perder toda la inversión (riesgo 7 de 7 en el KID).»**
3. Métrica de comisiones: **«Gestión 0 % · éxito 5 % del rendimiento positivo
   · reembolso inmediato 0,07 % (KID)»**; y en el aviso de conflicto, añadir que
   las Condiciones Finales permiten además hasta 0,2 % al suscribir al
   instante y 0,05 % al reembolsar.
4. Añadir a un aviso existente: **«No hay mercado secundario: solo puedes
   salir reembolsando al emisor o transmitiendo a otra wallet autorizada.»**

Recomendado: el KID abre con «Está a punto de adquirir un producto que no es
sencillo y que puede ser difícil de comprender»; vale la pena reflejarlo.
Editorial (lo decide Víctor): con riesgo 7/7 y emisor no supervisado,
`coleccion: principales` merece una segunda mirada.

### Bloqueos

- APY de midas.app no verificable (Cloudflare); correcto `rentabilidad: null`.
- Folleto base BPWO-84 completo no leído (ni por mí ni por el investigador).
- No revalidé la lista de países permitidos de la ventana de la web; la
  accesibilidad para España descansa en las FT y en ESMA, que es suficiente
  para `disponibleEs: confirmado` (con KYC, wallet propia y USDC).

---

## 4. casa-de-outeiro · **aprobada_con_cambios**

### Hechos comprobados por mí

| Hecho | Fuente | Hora UTC | Lo que vi |
|---|---|---|---|
| Estado de la campaña | `https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/slug/casa-de-outeiro/expand/documents,extra_fields,asset_issuance_relational,asset,type,campaign,campaign_progress` | 2026-11-02T16:32:07Z | `campaign_status = CAMPAIGN` · `campaign.start_date = 2026-07-01` · `campaign.end_date = 2026-10-31` · `extend_days = None` · `campaign.updated_time = 2026-07-01 15:58:38` · `invested = 1121000` · `invested_tokens = 44840` · `supply = 128800` · `minimum_revenue_money = 2000000` · `minimum_offer_money = 2000` · documentos re-subidos el 30/10 16:39–16:40 (FDF v5, Anexos v3, estatutos, valoraciones…). También `booked = 1693350` (sin significado documentado: no publicar). |
| Página de Alius | `https://aliuscap.com/projects/casa-de-outeiro` (Chromium) | 2026-11-02T16:32:45Z | «Campaña» · «Inversión mínima 2.000,00 €» · «Tokens vendidos 44.840» · «Días restantes --» · «Recaudado 1.121.000,00 €» · «Umbral de éxito 2.000.000,00 €» · botón «Invertir» visible. |
| Web del emisor | `https://casadeouteiro.com/emision-capital/` (Chromium) | 2026-11-02T16:33:13Z | Sigue diciendo «EMISIÓN DE CAPITAL HASTA 31/10». |
| FDF v5 | `https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/71/document/263` (sha256 `147cd972…0de3`, idéntico al expediente) | 2026-11-02T16:32:14Z | «Periodo de la oferta: Hasta completar suscripción. Fecha límite: 31/03/2027 · Madrid, 30 de octubre del 2026» · «Importe mínimo de financiación requerido: 2.000.000€ … se cancelará la financiación participativa y se reembolsarán las aportaciones … no incurrirán en ningún gasto» · «aportación mínima de 80 acciones (2.000€)» · «La presente oferta de financiación participativa no ha sido verificada ni aprobada por CNMV ni por la Autoridad Europea de Valores y Mercados» · «Se limita la transmisión inicial de las acciones hasta el año 2027. Los accionistas se comprometen a no transmitir sus acciones hasta el año 2026. Desde el año 2027 al año 2030 incluido se producirá una liberación del 10% en paquetes del 2.5% anual por inversor» · «El inversor no soportará coste alguno». |
| Registro CNMV | `https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor.aspx?nreg=11&nif=B76632793` | 2026-11-02T16:32:26Z | «ADVENTUREES CAPITAL PFP, SOCIEDAD LIMITADA · Proveedores de servicios de financiación participativa · Nº Registro oficial 11 · 03/11/2023 · www.aliuscap.com». El pie de aliuscap.com: «Alius Capital (ALIUS CAPITAL STOS PSFP S.L.) es un proveedor de servicios de financiación parti[cipativa]». |

### Discrepancias

- **Conflicto de plazo confirmado hoy (02/11)**: FDF v5 del 30/10 → fecha
  límite 31/03/2027; campaña en Alius → `end_date 2026-10-31` sin ampliación
  (no tocada desde el 01/07) y «Días restantes --»; emisor → «hasta 31/10». La
  campaña sigue en estado CAMPAIGN y con botón «Invertir»: no sé si acepta
  órdenes. Que la plataforma no haya actualizado su propia fecha dos días
  después del vencimiento resta confianza.
- **Cifra**: 1.121.000 € es exacta hoy (sin avance desde el 23/10, según el
  expediente); 56 % del mínimo.
- **Falta en la tarjeta que la CNMV no ha verificado la oferta**: la métrica
  «Supervisor: Plataforma registrada en la CNMV (PSFP nº 11)» es cierta, pero
  sin el literal de la FDF puede leerse como aval de la CNMV al proyecto.
- **Salida infravalorada**: «Transmisión limitada; liberación gradual desde
  2027» no transmite que entre 2027 y 2030 solo se libera un 2,5 % anual por
  inversor (10 % en total). La errata «hasta 2027 / hasta 2026» sigue en la FDF.
- La FDF está **fechada** el 30/10/2026; no comprobé firma (el expediente dice
  «firmada»).
- Incoherencia interna del expediente: `disponibleEs: confirmado` frente a
  `prioridadEditorial.compraDesdeEspanaComoParticular: no_confirmado`. Para la
  tarjeta vale «confirmado a nivel de plataforma» (PSFP española que admite no
  experimentados, según el expediente); no lo releí.

### Cambios obligatorios en la tarjeta

1. **No presentarla como oferta abierta** mientras la campaña de Alius
   conserve fin 31/10/2026: o pasa a `en_camino` (mi recomendación) o, si
   sigue en `principales`, con estado «plazo en conflicto» visible y el aviso
   de fechas en primer lugar. La decisión es de Víctor.
2. Añadir aviso con el literal: **«La CNMV no ha verificado ni aprobado esta
   oferta; el registro de la CNMV es de la plataforma, no del proyecto.»**
3. Métrica «Salida»: **«Bloqueo inicial; de 2027 a 2030 solo puedes
   transmitir un 2,5 % de tus acciones al año (ficha de datos)»**.
4. Cambiar «la ficha … del 30/10/2026» por «la ficha **fechada** el
   30/10/2026» en el aviso de plazo, y actualizar a 02/11/2026 la fecha de la
   cifra recaudada si se publica con mi lectura.

### Bloqueos

- No probé la contratación: no sé si «Invertir» acepta órdenes tras el 31/10.
- No leí las condiciones generales de Alius (plazo máximo de 6 meses citado en
  el expediente) ni la inscripción de la ERIR de la emisión en la CNMV.

---

## 5. hausera-proximas-ofertas · **aprobada_con_cambios**

### Hechos comprobados por mí

| Hecho | Fuente | Hora UTC | Lo que vi |
|---|---|---|---|
| Alicante 2 anunciada | `https://hausera.io/oportunidades/` (Chromium) | 2026-11-02T16:34:10Z | «Alicante 2 · PRÓXIMA OPORTUNIDAD · Preventa: 04/11/2026 09:00h · 01 DÍA 16 HORAS 25 MINUTOS · CRV · Importe a financiar: 5.196.000€ · Inicio de preventa: 04/11/2026 · Inicio de oferta pública: 11/11/2026 · Inicio de proyecto: 11/11/2026 · Fin previsto de proyecto: 11/07/2028 · Duración (meses): 20 · Rentabilidad sobre inversión: 22,00% · Rentabilidad anualizada: 13,20%». En el texto renderizado hoy no aparece la tarjeta «PREVENTA: 11/11/2026» que citaba el expediente. |
| Sin página ni documento de la emisión | `https://hausera.io/oportunidades/alicante-2/` y `https://hausera.io/alicante-2/` | 2026-11-02T16:34:49Z | 404 en ambas; el HTML de la portada (`curl`, 2026-11-02T16:34:28Z) no contiene enlace a documento de emisión de Alicante 2. |
| Entidad y naturaleza | `https://hausera.io/terms/` (Chromium) | 2026-11-02T16:34:18Z | «Denominación: HOLDTX SPAIN, S.L. … Nombre Comercial HAUSERA · NIF B67708032 · Registro Mercantil de Murcia» · «no una entidad de intermediación financiera ni una empresa de servicios de inversión. La participación … se formaliza directamente entre el Inversor y la sociedad Emisora (SPV)» · «"Preventa": … manifestación de interés no vinculante, sin que ello constituya actividad de colocación … ni garantía de asignación» · «La existencia de mercado secundario no está garantizada» · «posible pérdida total o parcial del capital invertido». Releído hoy (el expediente usaba la copia del 23/10). |
| Registro CNMV | `https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/listado-proveedores.aspx?lang=es` | 2026-11-02T16:34:51Z | 27 proveedores listados (incluye «ADVENTUREES CAPITAL PFP», control positivo); ni «HOLDTX» ni «HAUSERA». |
| Coste y público | `https://hausera.io/faq/` (Chromium) | 2026-11-02T16:35:19Z | «No, Hausera no cobra nada a los usuarios por invertir en la plataforma» · «dirigida a todo tipo de inversores: minoristas, profesionales e institucionales». |

### Discrepancias

- La nota publicada del 22/10 («no anunciaba ninguna oportunidad») es falsa
  hoy: el cambio es necesario.
- El conflicto 04/11 frente a 11/11 de la preventa que registró el expediente
  no se reproduce en mi lectura; las fechas que veo son coherentes: preventa
  04/11, oferta pública 11/11.
- La métrica «Supervisor: Operador no supervisado por la CNMV (según sus
  términos)» atribuye a los términos algo que no dicen: los términos dicen que
  no es ESI ni intermediario; que no está en la CNMV lo dice el registro.
- Las cifras de 22 % / 13,20 % no van a la tarjeta (bien: son previsiones sin
  documento de emisión).
- La tarjeta caduca por diseño el 04/11 (preventa) y el 11/11 (oferta).

### Cambios obligatorios en la tarjeta

1. Métrica «Supervisor»: **«Ninguno: HOLDTX SPAIN no figura en el registro de
   plataformas de financiación participativa de la CNMV y declara no ser
   empresa de servicios de inversión»** (o más corto: «No registrada en la
   CNMV»).
2. Añadir aviso: **«Puedes perder todo o parte del dinero; no hay mercado
   secundario garantizado.»** (términos §6.7).
3. Revisar la tarjeta de nuevo el 04/11 y el 11/11/2026; sin documento de
   emisión no se publica mínimo, plazo ni rentabilidad.

Editorial (lo decide Víctor): es la única de las cinco cuyo operador no tiene
registro en ningún supervisor; con el criterio de confianza del 01/11 es la
primera candidata a retirar. Mantenerla en `en_camino` con estos avisos es
aceptable.

### Bloqueos

- Documento de emisión de Alicante 2 no publicado (no hay página del proyecto).
- No consulté el registro de Portfolio Stock Exchange (no afecta a Alicante 2).

---

## Resumen

| Oferta | Veredicto | Lo esencial |
|---|---|---|
| spiko-letras-del-tesoro-euro | aprobada_con_cambios | 2,35 % (31 días, 30/10) exacto hoy, pero se recalcula a las 18:00 UTC del 02/11; «Comisión de gestión» → «Gastos corrientes»; CNMV registra la comercialización, no supervisa el fondo. |
| prosegur-digital-gold | aprobada_con_cambios | Contrato confirmado (+4 % / −6 %, 1–7 días hábiles aprox., producto no supervisado); MiCA solo cubre custodia/RTO/transferencia; corregir «segregado», coste en llano (~10 %). |
| mtbill | aprobada_con_cambios | ESMA FTWS-1420 pasaportado a España, KID 7/7, conflicto 25 %/5 % vs 15 %/50 % confirmado; falta aviso de patrimonio negativo y pérdida total; valor por token hoy 1,0769 USD (02/11). |
| casa-de-outeiro | aprobada_con_cambios | FDF v5 (31/03/2027) frente a campaña con fin 31/10 sin actualizar; 1.121.000 € de 2.000.000 €; no mostrar como abierta, añadir «no verificada por la CNMV» y salida real (2,5 %/año). |
| hausera-proximas-ofertas | aprobada_con_cambios | Alicante 2: preventa 04/11, oferta 11/11, sin documento ni página; HOLDTX no está en la CNMV; corregir atribución de «Supervisor» y añadir aviso de pérdida. |

Ninguna se rechaza: en las cinco el cambio crítico del expediente se sostiene
en la fuente primaria releída hoy; los cambios pedidos corrigen precisión y
avisos, no el sentido de la actualización.
