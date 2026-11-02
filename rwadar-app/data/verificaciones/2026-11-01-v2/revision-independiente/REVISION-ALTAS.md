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

