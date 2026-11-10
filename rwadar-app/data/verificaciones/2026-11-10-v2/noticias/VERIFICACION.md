# Verificación independiente · noticias de Inicio · 10/11/2026

Verificador: Claude (no eligió ni redactó las noticias). Archivo revisado:
`noticias-2026-11-10.json` (8 noticias). Cada fuente se volvió a abrir con
curl entre las **15:41 y las 15:45 UTC** del 10/11/2026; copias de trabajo en
el directorio temporal de la sesión, fuera del repositorio. La huella SHA-256
(primeros 16 caracteres) coincide con la que anotó `EDICION.md` en todas las
fuentes del JSON. La única distinta es la página española de Robinhood
(`074389a2e6ae51aa` frente a `8ba566150227848b`), que es HTML dinámico y que no
es la fuente enlazada; su texto clave no cambia.

**Veredicto: con cambios.** 5 confirmadas, 3 corregidas, ninguna quitada.
Correcciones ya aplicadas al JSON, que se ha validado de nuevo (claves, fechas,
secciones, longitudes 90/220/160 en los dos idiomas, URL en https).

## Resumen

| # | id | Veredicto | Motivo corto |
|---|---|---|---|
| 1 | cnmv-advierte-clones-xtb-pjt | confirmada | Nueve entidades, clones de XTB y PJT; fecha 10/11 |
| 2 | robinhood-stock-tokens-suplemento | **corregir** | El plan de nombrar a Robinhood Europe, UAB **no está en el suplemento del 09/11**: ya figuraba en el folleto base del 25/06/2026 |
| 3 | etsg-estandares-tokenizacion | confirmada | ESMA, 09/11; plazo 27/11; industria mayorista |
| 4 | prosegur-cash-pagares-dlt | **corregir** | «No hay documento público» es una ausencia no probada: pasa a «No hemos hallado» |
| 5 | consejo-ue-tope-regimen-piloto-dlt | confirmada | 6.000 → 300.000 millones por infraestructura; Coreper 04/11 |
| 6 | cnmv-autoriza-bit2me-stx | confirmada | Nota CNMV 28/10; ESMA da dos en España |
| 7 | esma-cuotas-financiacion-participativa | **corregir** (solo inglés) | «scrutinises» exagera el «señala riesgos» del castellano y del original |
| 8 | cnmv-reclamaciones-cripto-financiacion-participativa | confirmada | Nota CNMV 15/10; comentarios hasta el 16/11 |

Sección «hoy»: las tres son del 10/11 (n.º 1) o del 09/11 (n.º 2 y 3). Bien.
Sección «importante»: del 15/10 al 06/11, todas dentro de los últimos 30 días.
Sin nombres de personas físicas en el JSON (las fuentes de ESMA, Robinhood y
el Consejo citan a personas; no se trasladan).

## 1 · CNMV, advertencia de entidades no registradas · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7b512d6e8c-0490-4a9b-a9f3-b44776391f76%7d
- 15:41:52 UTC · HTTP 200 · application/pdf · SHA-256 `d6d617a4766a5c43…`
- Literal: «ADVERTENCIA DE ENTIDADES NO REGISTRADAS · 10 de noviembre de 2026».
- Cuento nueve: delta-capital.cfd, evli-ia.com, nifrol.com, l.cryppinv.cc,
  directa.es, client.finantialhub.com, market.wexford-advisory.limited (clon),
  PJTURBO APP (CLON), PJTURTRA APP (CLON).
- «No guarda relación con XTB S.A., SUCURSAL EN ESPAÑA (www.xtb.es),
  debidamente registrada…» y «No guardan relación con PJT PARTNERS PARK HILL
  (SPAIN), A.V., SOCIEDAD ANONIMA».
- «no figuran inscritas en el correspondiente registro de esta Comisión y, por
  tanto, no están autorizadas para prestar servicios de inversión».
- «Se hace pasar por» traduce «(clon)», que es la palabra de la CNMV para eso.
  El consejo de comprobar entidad y web es protección, no recomendación.

## 2 · Robinhood Assets (Jersey), suplemento del 09/11 · corregir

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- 15:41:54 UTC · HTTP 200 · application/pdf · SHA-256 `978eea67a47d5bb6…`
- Confirmado: «Supplement dated 09 November 2026 to the Base Prospectus dated
  25 June 2026» y «This Supplement has been approved by the Financial Market
  Authority Liechtenstein (the "FMA") on 09 November 2026».
- Confirmado, punto (1)(C) del suplemento: «the Issuer is permitted to pass on
  certain fees and costs charged to the Issuer in connection with an
  Underlying to Investors, which may include proportionately reducing the
  number of Products held by such Investors».
- **Error del borrador.** La frase «The Issuer anticipates appointing
  Robinhood Europe, UAB as an Authorised Participant in the near future» solo
  aparece en el PDF **después** de «End of this Supplement», dentro de la
  versión consolidada, que avisa: «[Warning: the following consolidated
  version of the Base Prospectus is for illustration purposes only and is
  neither part of this Supplement nor the Base Prospectus and was therefore
  not approved by the FMA]». Las secciones del suplemento (hasta la firma) no
  nombran a Robinhood Europe, UAB.
- Lo comprobé en el folleto base original:
  https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus.pdf
  (15:43:21 UTC, HTTP 200, fechado «25 June 2026»): ya dice «The Issuer
  anticipates appointing Robinhood Europe, UAB as an Authorised Participant in
  the near future». No es una novedad del 09/11, y el titular la presentaba
  como tal.
- Pasaporte a España: registro de folletos de ESMA (API Solr,
  `party_name:*ROBINHOOD*`, 15:43:54 UTC): «BPWO-83», aprobado 25/06/2026, y
  «SUPP-69», aprobado 09/11/2026, los dos con SPAIN entre los Estados
  notificados. Cambio «con pasaporte» por «notificado a España», que es lo que
  dice el registro.
- Producto que vende hoy Robinhood en España: https://robinhood.com/eu/es/invest/
  (15:41:55 UTC, HTTP 200): «Construye tu cartera con Classic Stock Tokens» y
  «Explora más de 2.000 Classic Stock Tokens vinculados a NVIDIA, Microsoft,
  Apple, Vanguard S&P 500 ETF y más». Es la web, no la app: digo «Robinhood
  en España», no «la app».
- El suplemento también permite usar como subyacente fondos cotizados (ETP)
  de gestión activa: digo «acciones y ETF de EE. UU.».
- Texto aplicado:
  - titulo: «El emisor de los «Stock Tokens» de Robinhood podrá repercutir ciertos costes al inversor» (88)
  - resumen: «La FMA de Liechtenstein aprobó un suplemento al folleto de estos tokens de deuda ligados a acciones y ETF de EE. UU., notificado a España. Deja al emisor repercutir costes, incluso restando tokens a cada inversor.» (213)
  - porQueImporta: «En España, Robinhood solo vende hoy los «Classic». Que su filial europea sea participante autorizado es un plan que el folleto ya recogía en junio.» (147)
  - en.titulo: «Robinhood's Stock Tokens issuer may pass certain costs on to investors» (70)
  - en.resumen: «Liechtenstein's FMA approved a supplement to the prospectus of these tokenised debt securities tied to US shares and ETFs, notified to Spain. It lets the issuer pass on costs, even by cutting each investor's tokens.» (215)
  - en.porQueImporta: «In Spain, Robinhood only sells the Classic tokens today. Making its EU subsidiary an authorised participant is a plan the prospectus already set out in June.» (157)

## 3 · ESMA, European Tokenisation Standards Group · confirmada

- URL: https://www.esma.europa.eu/press-news/esma-news/eu-seeks-nominations-stakeholder-group-tokenisation-standards-finance
- 15:41:55 UTC · HTTP 200 · SHA-256 `d172fea1ccce11d9…`
- Literal: «09/11/2026 The European Central Bank (ECB), together with the European
  Commission and the European Securities and Markets Authority (ESMA), is
  calling upon wholesale financial industry stakeholders to express their
  interest in joining the European Tokenisation Standards Group (ETSG)».
- «develop common standards for an interconnected tokenised financial
  ecosystem»; «the ETSG will be chaired by participants from the industry,
  with the ECB, the Commission and ESMA acting as observers»; «The deadline
  for submitting applications is 27 November 2026».
- Nota menor sin cambio: «fijará» resume «develop»; el sentido se mantiene.

## 4 · CNMV, ERIR de Minos Securities (Prosegur Cash) · corregir

- URL: https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A23875529&lang=es
  (redirige a `erir_esi?nif=…`, misma página)
- 15:41:55 UTC · HTTP 200 · SHA-256 `6d7eb7cbca433bc8…`
- Literal: «06/11/2026 PROSEGUR CASH, S.A. Inscribir en el Registro Oficial …
  a MINOS SECURITIES, A.V., S.A. como entidad responsable de la inscripción y
  del registro de la emisión de pagarés representada mediante sistemas
  basados en tecnología de registros distribuidos, denominara "1ª Emisión de
  Pagarés Prosegur Cash 2026" por importe de 500.000 euros».
- Aviso literal: «no implica que la CNMV haya validado las condiciones de la
  emisión ni la información facilitada por el emisor».
- Fecha, importe, entidad y nombre de la emisión: correctos.
- «No hay documento público ni consta a quién se vende»: es una ausencia. La
  CNMV no lo dice; sale de la búsqueda de `candidatas-espana` y de mi
  comprobación de minos-securities.com (15:44:31 UTC, HTTP 200, ninguna
  mención a pagarés ni a Prosegur) y prosegurcash.com (HTTP 200, sin mención).
  Que no lo encontremos no prueba que no exista: lo digo así.
- Texto aplicado:
  - porQueImporta: «Es deuda tokenizada de una empresa española, pero la CNMV avisa: inscribirla no valida sus condiciones. No hemos hallado documento público ni a quién se vende.» (159)
  - en.porQueImporta: «It is tokenised debt from a Spanish company, but the CNMV warns registration does not validate its terms. We found no public document or target buyers.» (151)

## 5 · Consejo de la UE, tope del régimen piloto DLT · confirmada

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- 15:41:56 UTC · HTTP 200 · application/pdf · SHA-256 `757b8851957af55c…`
- Considerando 76: «an aggregate cap that limits the total value of financial
  instruments intermediated by a DLT market infrastructure of EUR 6 billion.
  Those activity thresholds have made it difficult for certain large market
  participants … Therefore, all asset-specific caps should be withdrawn,
  whereas the aggregate cap should be raised to EUR 300 billion».
- Artículo 3.2 nuevo: «shall not exceed EUR 300 billion» por cada «DLT
  market infrastructure». El resumen («cada infraestructura DLT») es fiel.
- ST 14900/26, https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf
  (15:41:58 UTC, HTTP 200, SHA-256 `54f5eeefda10ae00…`): lista de puntos «A»
  del ECOFIN del «9 November 2026», punto b) 13779/1/26 REV 1, «General
  approach approved by Coreper. Part 2, on 04.11.2026».
- ST 15099/26 (15:44:51 UTC, HTTP 200): «Negotiations within the European
  Parliament continue». Confirma que aún no es ley.
- La sala de prensa del Consejo da HTTP 403 por el proxy: no se afirma nada
  del resultado del ECOFIN del 09/11, y la noticia no lo hace.

## 6 · CNMV autoriza Bit2Me STX · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- 15:41:58 UTC · HTTP 200 · application/pdf · SHA-256 `e09fadd373bf3621…`
- Literal: «28 de octubre de 2026 … La infraestructura, denominada Bit2MeSTX,
  será operada por Bit2Me Security Tokens Exchange STX, A.V., S.A.» y «En
  Bit2MeSTX se podrán negociar acciones y bonos representados en TRD».
- «Segundo» y «España suma dos con Securitize»: lista de ESMA
  https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
  (15:45:13 UTC, HTTP 200, SHA-256 `8f223820d3223598…`, creada el 04/11/2026):
  solo dos de España, «Securitize Europe DLT TSS … 26 November 2025» y
  «Bit2Me STX DLT TSS … 27 October 2026».
- «No consta ninguna [emisión] con documento público para particulares»:
  coincide con DECISIONES-COORDINADOR.md («Bono Valorix (Bit2Me STX) … Siguen
  sin documento de emisión») y está redactado como «no consta».

## 7 · ESMA, pregunta y respuesta 2950 · corregir (inglés)

- URL: https://www.esma.europa.eu/publications-data/questions-answers/2950
- 15:41:59 UTC · HTTP 200 · SHA-256 `20be52a638f4bf73…`
- Literal: «ESMA_QA_2950 16/10/2026 … the application of membership or access
  fees, does not in itself prevent a platform from being considered publicly
  accessible» y «ESMA considers that the application of upfront membership or
  other access fees may raise investor protection concerns when, in
  particular: the fees are required before investors … are allowed to access
  any key information …; the fees' purpose, allocation, or beneficiary is not
  clearly disclosed; the fees may create conflicts of interest».
- Castellano fiel. El título inglés «ESMA scrutinises…» dice más que el
  original y que el título en castellano («señala riesgos»).
- Texto aplicado: en.titulo «ESMA flags risks at crowdfunding platforms that charge access fees» (66).

## 8 · CNMV, consulta sobre reclamaciones · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- 15:42:00 UTC · HTTP 200 · application/pdf · SHA-256 `289265b26b53f727…`
- Literal: «15 de octubre de 2026 … Ampliar dicho procedimiento a las
  reclamaciones derivadas de la prestación de servicios de criptoactivos y de
  financiación participativa» y «Los comentarios pueden enviarse por escrito
  hasta el próximo 16 de noviembre de 2026».
- «Por ahora es un proyecto»: correcto («proyecto de Circular»).

## Comprobaciones generales

- Longitudes tras las correcciones (máximo 90/220/160): ninguna se pasa, en
  castellano ni en inglés.
- Ninguna noticia da precios, promete rentabilidad ni recomienda comprar.
- Fuente primaria en las ocho (regulador o emisor); ninguna se apoya en
  prensa.
- `fecha` es la del hecho y `consultadaEl` la de consulta (10/11) en todas.
