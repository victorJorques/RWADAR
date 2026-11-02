# Revisión independiente de las tres altas propuestas · 2 de noviembre de 2026

Revisor: Claude (no participó en la investigación). Alcance: las tres
candidatas con `decision: admitir_propuesta` del ciclo 2026-11-01-v2.
Método: volví a abrir yo mismo las fuentes primarias (registros de
supervisores, KID, folletos, tarifas, páginas oficiales), solo páginas y
documentos públicos, sin login, KYC, formularios ni wallets. Las horas son
UTC reales de mi lectura. No he editado los expedientes.

Copias de lo que leí (no versionadas): carpeta de trabajo de la sesión
`/tmp/claude-0/-home-user-RWADAR/bcd94329-4aea-5eb8-87b2-dce08ca7c659/scratchpad/revisor-altas/data/`.

Estado de la revisión: en curso; cada alta se añade al cerrarla.

---

## 1. spiko-letras-del-tesoro-dolar · veredicto: **aprobada_con_cambios**

Cambios pequeños de rótulo y precisión; ningún bloqueo. Todo lo esencial del
expediente lo he vuelto a ver en su fuente y coincide hoy.

### Hechos comprobados por mí (2 de noviembre de 2026)

| # | Fuente (URL) | Hora UTC | Qué vi |
|---|---|---|---|
| 1 | https://geco.amf-france.org/produit-d-epargne/c79398 (renderizada con navegador) | 16:28:13 | «OPC : SPIKO US T-BILLS MONEY MARKET FUND» · Société de gestion TWENTY FIRST CAPITAL · Dépositaire CACEIS Bank · «N° Agrément/Visa : SCV20240013» · «Date d'autorisation : 05/04/2024» · «Statut : Vivant» · «Fonds monétaire à valeur liquidative variable (VNAV) court terme» · «Type de souscripteurs : Tous souscripteurs» · SICAV SCV20240012 · partes vivas «Action USD FR001400ODM9» y «EUR non hedgée FR001400SBD3» · Prospectus con «Date d'effet 01/09/2026». La VL que muestra GECO (0,98304 € a 30/10/2026) es la de la clase EUR, no la de la tarjeta. |
| 2 | https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es | 16:29:00 | «SPIKO SICAV · Nº Registro oficial 2380 · Fecha registro oficial 30/01/2026 · SICAV · FRANCIA» · «IIC Sujeto a la directiva 2009/65/CE». No desglosa compartimentos (igual que vio el investigador). |
| 3 | https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-entites/records?where=siren%3D%22980659585%22 | 16:29:24 | «Spiko Finance» · CIB 19183 desde 2025-12-15 · «Entreprise d'Investissement» · «Agrément» · LEI 969500NW8QTZA7UG8M82. |
| 4 | https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-passeports-sortants/records?where=id_referentiel%3D751211%20and%20pays%3D%22ESPAGNE%22 (curl cortado por el proxy; leído con WebFetch) | ≈16:29:40 | «Libre prestation de services» · «ESPAGNE» · desde 2026-01-08 · servicio A1 (recepción y transmisión de órdenes) sobre C3 (participaciones de IIC). Dato nuevo que el expediente no recoge: también B2 y B4 sobre C3 desde 2026-06-16 (B4 = servicio de cambio de divisa ligado al servicio de inversión, coherente con la conversión EUR→USD). |
| 5 | https://docs.spiko.io/documentation/product_overview/fund_availability (renderizada) | 16:28:09 | Fila «🇪🇸 Spain ✅ ✅ ✅ ❌», columna T-BILLS DOLLAR ✅ · «Last updated: October 23, 2026» · «REGISTRATIONS ARE PER SHARE CLASS … A share class created later needs its own registration». La clase USD se creó el 21/02/2024 (GECO), antes de la inscripción en la CNMV (30/01/2026), así que queda cubierta. |
| 6 | https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf · SHA-256 c1ce5400…7e92f6 (idéntico al del expediente) | 16:27:33 | «Fecha de la última revisión … 01/09/2026» · «indicador de riesgo 1 sobre 7» · «Atención al riesgo de cambio … Este riesgo no se tiene en cuenta en el indicador anterior» · «El capital no está garantizado» · «Gastos de gestión y otros gastos administrativos u operativos 0,25 % … basado en los costes reales del último año» · entrada y salida «No se aplican costes» · «Depositario: CACEIS Bank» · gate «umbral del 10 % del patrimonio neto» · periodo de tenencia recomendado 1 semana · «dirigido a todo tipo de inversores». |
| 7 | https://cdn.spiko.finance/legal_docs/EN/Prospectus_Spiko_SICAV_EN.pdf · SHA-256 7457e79f…ffb35 (idéntico) | 16:29:58 | «Publication date: 1 September 2026» · p. 5 y p. 23: «USD Share FR001400ODM9 … 1 USD … 1 USD … All investors» y «EUR Share FR001400SBD3 … 1 EUR» · p. 21: «Orders are executed based on the next net asset value (NAV), meaning at an unknown NAV. The NAV is computed and published on the same day» y «In case of public holidays in France or the United States … on the following business day» · p. 22: gate al 10 %, «20 net asset values over a 3-month period», «may not exceed 1 month». |
| 8 | https://public-api.spiko.io/v0/share-classes/USTBL/yield · /net-asset-values/USTBL/latest · /share-classes/USTBL · /net-asset-values/USTBL?startDay=2026-09-25&endDay=2026-11-02 | 16:27:10–16:27:27 | `monthlyYield "0.0413"`, `updatedAt 2026-10-30T16:02:00Z`; VL 1,101207 USD del 30/10/2026; `minimumInitialSubscription "1"`, `subscriptionFees "0"`, `redemptionFees "0"`, `managementFees "0.0025"`, ISIN FR001400ODM9. **Recalculé la cifra yo mismo** con la serie de VL: 1,097427 (29/09) → 1,101207 (30/10), 31 días, capitalizado = **4,13 %** (simple 4,06 %). A las 16:27 UTC del lunes 02/11 aún no había VL del día (próximo cálculo anunciado para las 18:00 UTC), así que 4,13 % sigue siendo la última cifra. |
| 9 | https://www.spiko.io/es/spiko-letras-del-tesoro-dollar (renderizada y HTML) | 16:30:37 / 16:30:53 | Muestra «4,13%» y «Rentabilidades netas anualizadas (después de comisiones) de los últimos 31 días» · «Depósito inicial mínimo $1» · «Comisiones de gestión 0,25%» · conversión EUR→USD «sin comisiones de cambio, utilizando la tasa de referencia de Bloomberg de las 11:30 AM CET» · FAQ «¿Puedo abrir una cuenta como particular? — ¡Por supuesto!». La URL de la tarjeta responde 200 (la variante «-dolar» da 404, como anotó el investigador). |

### Discrepancias

1. **KID frente a folleto sobre el precio de ejecución** (confirmado): el KID ES
   dice «se ejecutan sobre la base del último valor liquidativo conocido»; el
   folleto (p. 21) y la API dicen VL desconocido del mismo día. La tarjeta no
   promete precio, así que no bloquea. Basta con no escribir nunca «al precio
   conocido».
2. **Rótulo de costes**: la tarjeta pone «Comisión de gestión · 0,25 % anual
   (KID)», pero el KID no lo llama así. Lo llama «Gastos de gestión y otros
   gastos administrativos u operativos», calculados con los costes reales del
   último año. El máximo del folleto es más alto (0,30 % + 0,10 %).
3. **La web comercial dice más que el KID**: «La liquidez diaria está
   garantizada contractualmente» y «Solo estarían en riesgo en el caso … de que
   el Gobierno federal de EE. UU. incumpliera». Eso choca con el gate del 10 %,
   con el riesgo de cambio y con «El capital no está garantizado» del KID. La
   tarjeta propuesta no copia esas frases, y no debe hacerlo.
4. **Días hábiles**: el KID solo menciona festivos franceses. El folleto añade
   los de EE. UU., y la serie de VL lo confirma (no hay VL el 12/10/2026). La
   métrica «Reembolso diario» es correcta si se precisa «días hábiles».
5. **Mínimo de la clase EUR (1 EUR en el folleto frente a 1.000 EUR en la API)**:
   no lo comprobé, porque la tarjeta no lo usa. Sigue sin publicarse.

### Cambios obligatorios en la tarjeta

- Métrica «Comisión de gestión» → **«Gastos corrientes (KID)» · «0,25 % anual»**.
- Métrica «Reembolso» → **«Diario en días hábiles (Francia y EE. UU.), corte
  11:30 París»**.
- Al publicar, **renovar la cifra y su fecha**: la rentabilidad cambia cada día
  hábil. Si se publica con otra VL, hay que sustituir «4,13 % · 30/10/2026» por
  la cifra y la fecha del día, tomadas de la misma API.
- No incorporar textos comerciales de «liquidez garantizada» ni de «dinero
  totalmente protegido».

Se puede mantener tal cual: título, resumen (ya menciona el tipo de cambio),
avisos (riesgo de cambio, capital no garantizado, gate del 10 %), pasos
(«Abres cuenta con KYC», «Depositas euros o dólares», «Reembolso diario»: ≤ 4
palabras, sin cifras ni marcas) y concepto (sin marcas ni cifras).

### Bloqueos

Ninguno que impida el alta. Límites que conviene saber: la CNMV no desglosa
el compartimento, aunque la tabla del emisor y el criterio de inscripción por
clase lo cubren; el folleto en español no se pudo leer. No repetí la búsqueda
de advertencias de la CNMV para Spiko (ver el apartado final).

---

## 2. robinhood-classic-stock-tokens · veredicto: **aprobada_con_cambios**

La entidad, los permisos, el acceso desde España, las comisiones y el riesgo
coinciden con las fuentes. Además, he resuelto los dos huecos que el
investigador dejó abiertos: el programa de actividades en la CNMV y la
disponibilidad por países. Los cambios afectan a cómo se cuenta la salida y a
un paso que lleva marca.

### Hechos comprobados por mí (2 de noviembre de 2026)

| # | Fuente (URL) | Hora UTC | Qué vi |
|---|---|---|---|
| 1 | https://www.lb.lt/en/sfi-financial-market-participants/robinhood-europe-uab | 16:31:53 | «Authorization code: LB002288, LB002294, LB002341» · «Category A financial brokerage firm licence (valid from: 2025-04-03)» · «Crypto-asset service provider licence (valid from: 2025-05-29)» · «Payment institution licence (valid from: 2026-03-12)» · Company code 306377915 · LEI 254900GTP4UXQO1UMI36 · actividades desde 2025-04-03: «Reception and transmission of orders», «Execution of orders on behalf of clients», «**Dealing on own account**», «Safekeeping, administration…», «Foreign currency exchange services, when they are related to provision of investment services» · «Provision of services without a branch in other Member States: **29**». El EEE tiene 30 Estados, así que 29 son todos menos Lituania. La lista de países está en un modal que no se carga sin JavaScript, por lo que España no la vi nombrada aquí. |
| 2 | https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5299 (y la pestaña `&vista=17`, «Programa de actividades») | 16:32:27 / 16:34:13 | «ROBINHOOD EUROPE, UAB · ESI del EEE en Libre Prestación · Nº Registro Oficial 5299 · 21/04/2025 · LITUANIA». **Dato nuevo, que el investigador no pudo ver:** el programa de actividades notificado para España incluye «3. **Negociación por cuenta propia** – 4) Contratos de opciones, futuros, permutas (swaps) … y otros contratos de derivados relacionados con valores…», además de recepción y transmisión y ejecución de órdenes sobre derivados (C4, C5, C10) y custodia. Es la actividad que necesita un derivado OTC en el que Robinhood es la contraparte. |
| 3 | https://cdn.robinhood.com/assets/robinhood/legal/stock_tokens_kid_eu.pdf · SHA-256 d744e3ac…caee96 (idéntico) | 16:31:52 | «Date of Document Production: 1 July 2026» · «an over-the-counter ('OTC') derivative» · «Holding the Product does not mean you own any shares» · «**We have classified this Product as 7 out of 7**» · «Be aware of currency risk» · «not covered by an investor compensation or deposit insurance scheme» · «Robinhood Europe is the sole counterparty» · costes: entrada 0,10 %, salida 0,10 %, corrientes 0,00 %, operación 0,00 % · «Recommended holding period: 1 year» · «complex financial instrument suitable only for informed retail investors» · horario: «**You can usually trade the Product during normal NASDAQ trading hours, from 09:30 to 16:00 Eastern Time** … may make trading possible outside of these hours, although this service may not always be available» · «**Robinhood Europe may suspend the closing of positions** … requests made outside US trading hours…». |
| 4 | https://cdn.robinhood.com/assets/robinhood/legal/fee_schedule_EU.pdf · SHA-256 614b0f5b…503228 (idéntico) | 16:31:53 | «Robinhood Classic Stock Tokens · Trading and FX Fees: Robinhood Europe applies a 0.10% currency conversion fee for each transaction … does not apply any other fees related to the trading of Classic Stock Tokens» · pie 20260901-5888610-18779116. |
| 5 | https://cdn.robinhood.com/assets/robinhood/legal/description_of_services_financial_instruments_and_risks_eu.pdf · SHA-256 4e3ab0a2…f4cbf4f4 (idéntico) | 16:31:53 | «will apply from 1 July 2026» · §5 «you will be required to fill out an appropriateness questionnaire» · p. 12: «The token is non-transferable and non-assignable» · «cash-settled only, meaning that they may not be redeemed for the underlying shares» · «clients shall have a right to dividend amounts … dividends are not guaranteed» · «Robinhood hedges its obligations by purchasing US shares or ETPs for its own account on a 1:1 basis … clients should be aware of the counterparty risk». |
| 6 | https://robinhood.com/eu/es/invest y https://robinhood.com/eu/en/invest (renderizadas) | 16:35:01 / 16:35:12 | ES: «Explora más de 2.000 Classic Stock Tokens» · «Una comisión por cambio de divisas del 0,1 % cubre todo» · «Empieza con tan solo 1 euro» · «Compra y vende Classic Stock Tokens 24/5, de lunes a viernes. Operar en horario ampliado entraña riesgos adicionales» · «son contratos derivados entre tú y Robinhood». EN: «Start with as little as €1» · «The underlying assets … are owned by Robinhood and held with a US-licensed institution». La traducción española («Custodiados por una institución con licencia estadounidense») no deja claro que esos activos son de Robinhood y no del cliente. |
| 7 | https://robinhood.com/newsroom/europe-investment-gap-why-investors-are-turning-to-new-technologies-to-access-markets/ (comunicado propio del 22/06/2026; lo encontré con el buscador y lo leí en la fuente) | 16:36:42 | «**eligible customers in every country in the EU and EEA\* can access more than 2,000 Classic Stock Tokens**» · nota: «\*Some product restrictions in certain countries, including Belgium (crypto perpetual futures) and Hungary (crypto trading)». España no tiene ninguna restricción. Esto cubre el hueco de la «lista oficial de países» que el investigador no encontró. |

### Discrepancias

1. **«24/5» no sale del KID.** La métrica «Reembolso: Recompra por Robinhood,
   24/5» toma el «24/5» de la página comercial. El KID dice que normalmente se
   opera en horario del NASDAQ, que el horario ampliado «may not always be
   available» y que Robinhood puede suspender el cierre de posiciones. La salida
   tiene que contarse con ese límite.
2. **Un paso lleva marca**: «Robinhood recompra». El encargo pide pasos sin
   marcas.
3. **El título puede leerse como «acciones tokenizadas».** «Classic Stock
   Tokens de acciones de EE. UU.» no dice que es un derivado. El resumen sí lo
   dice, y el propio motivo de la decisión exige presentarlo como derivado.
4. **Custodia en la versión española de la web**: da a entender que se
   custodia algo del cliente en EE. UU. La versión inglesa y el documento de
   riesgos dejan claro que los subyacentes son de Robinhood (cobertura 1:1) y
   que el cliente solo tiene un crédito contractual. La tarjeta no debe hablar
   de «custodia en EE. UU.».
5. **Incidencia del Banco de Lituania de julio de 2025**: sigue sin fuente
   primaria. La ficha del supervisor que leí no muestra sanciones ni
   restricciones. No debe publicarse como hecho.
6. Detalle sin importancia: el expediente cita el «24/5» en el KID p. 1 y p. 3,
   pero no está ahí.

### Cambios obligatorios en la tarjeta

- **Título** → «Classic Stock Tokens: derivados sobre acciones de EE. UU.» (o
  cualquier fórmula con «derivados» en el título).
- **Métrica «Reembolso»** → rótulo «Salida» y valor **«Cierre con la
  contraparte en días de mercado de EE. UU.; puede suspenderse»**. Si se quiere
  mencionar el «24/5», añadir «(horario ampliado, no siempre disponible)».
- **Paso 3** «Robinhood recompra» → **«Cierras con la contraparte»** o «Vendes
  al emisor» (≤ 4 palabras, sin marca).
- **Aviso nuevo**: «La contraparte puede suspender el cierre de posiciones
  (KID)».
- Recomendado, no obligatorio: métrica «Plazo recomendado (KID) · 1 año».

Se puede mantener tal cual: resumen, «Desde 1 €» (respaldado en la web en
español y en inglés, aunque el KID no fija mínimo), «0,10 % de cambio por
operación; sin gestión», «Riesgo KID 7 de 7», «Banco de Lituania · CNMV
libre prestación nº 5299», los cuatro avisos actuales, los pasos 1 y 2 y el
concepto (sin marcas ni cifras).

### Bloqueos

Ninguno. El expediente debería pasar `accesoEspana` de «sin lista oficial» a
«respaldado», con el comunicado del 22/06/2026 y el programa de actividades
de la CNMV. La red blockchain sigue sin nombrarse en los documentos, pero no
importa, porque el token no se puede transferir.

