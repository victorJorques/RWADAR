# Verificación independiente · noticias de Inicio · 11/11/2026

Verificador: Claude (no eligió ni redactó las noticias). Archivo revisado:
`noticias-2026-11-11.json` (6 noticias: 1 de «Hoy» y 5 de «Lo más
importante»). Cada fuente se volvió a abrir con curl, con su agente de
usuario, entre las **09:22 y las 09:25 UTC** del 11/11/2026. Copias de trabajo
en el directorio temporal de la sesión, fuera del repositorio.

La huella SHA-256 (primeros 16 caracteres) coincide con la de `EDICION.md` y
con la del 10/11 en todas las fuentes enlazadas. Solo cambia la página
española de Robinhood, que es HTML dinámico y no es la fuente enlazada; su
texto clave sigue.

**Veredicto: con cambios.** 5 confirmadas, 1 corregida (solo el titular en
castellano), ninguna quitada. La corrección ya está aplicada al JSON, que pasa
`validarNoticias()` de `rwadar-movil/lib/noticias-sector.js` (6 noticias).

Respecto del 10/11 solo cambian 4 titulares (`titulo` y `en.titulo`) y la
sección de Robinhood («hoy» → «importante»). Resúmenes, «por qué importa»,
`tituloInformativo`, fechas, fuentes e imágenes son los verificados ayer; los
he vuelto a cotejar con la fuente de hoy.

## Resumen

| # | id | Veredicto | Motivo corto |
|---|---|---|---|
| 1 | cnmv-advierte-clones-xtb-pjt | confirmada | Nueve entidades; tres clones (1 de XTB, 2 de PJT); 10/11, 12:20 |
| 2 | robinhood-stock-tokens-suplemento | **corregir** (titular ES) | «el emisor podrá restar tokens» sin «por costes»: el inglés sí lo dice y la fuente lo liga a costes |
| 3 | prosegur-cash-pagares-dlt | confirmada | ERIR de Minos, 06/11, 500.000 €; aviso de la CNMV |
| 4 | consejo-ue-tope-regimen-piloto-dlt | confirmada | 6.000 → 300.000 millones por infraestructura = 50 veces; Coreper 04/11 |
| 5 | cnmv-autoriza-bit2me-stx | confirmada | Nota CNMV 28/10; ESMA da dos en España |
| 6 | cnmv-reclamaciones-cripto-financiacion-participativa | confirmada | Proyecto de Circular; comentarios hasta el 16/11 |

**«Hoy».** Solo la n.º 1, del 10/11. La lista de notas de prensa de la CNMV
(https://www.cnmv.es/portal/aldia/notasprensa, 09:22:52 UTC, HTTP 200) da
arriba «10/11/2026 12:20 Advertencias de la CNMV de entidades no registradas»
y nada del 11/11 a esa hora. Bien.

**«Importante».** Del 15/10 al 09/11: todas dentro de los últimos 30 días
(desde el 12/10).

**Imágenes.** Las seis claves (`alerta-fraude`, `acciones-eeuu`,
`pagares-deuda`, `instituciones-ue`, `bolsa-madrid`, `regulador-espana`)
existen en `rwadar-editorial-source/noticias/fotos.json`.

**Personas.** Ningún nombre de persona física en el JSON (castellano ni
inglés).

## 1 · CNMV, advertencia de entidades no registradas · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7b512d6e8c-0490-4a9b-a9f3-b44776391f76%7d
- 09:22:44 UTC · HTTP 200 · application/pdf · SHA-256 `d6d617a4766a5c43…` (igual que el 10/11)
- Literal: «ADVERTENCIA DE ENTIDADES NO REGISTRADAS · 10 de noviembre de 2026».
- Nueve entidades: delta-capital.cfd, evli-ia.com, nifrol.com, l.cryppinv.cc,
  directa.es, client.finantialhub.com (seis webs), market.wexford-advisory.limited
  «(clon)» y PJTURBO APP «(CLON)» y PJTURTRA APP «(CLON)». Siete webs y dos
  apps: «nueve webs y apps» es exacto.
- «No guarda relación con XTB S.A., SUCURSAL EN ESPAÑA (www.xtb.es),
  debidamente registrada…» y «No guardan relación con PJT PARTNERS PARK HILL
  (SPAIN), A.V., SOCIEDAD ANONIMA».
- «no figuran inscritas en el correspondiente registro de esta Comisión y, por
  tanto, no están autorizadas para prestar servicios de inversión».
- Titular «La CNMV destapa clones de XTB y PJT entre 9 chiringuitos» (56):
  tres clones dentro de nueve; «chiringuitos» es palabra de la propia nota
  («Las advertencias de la CNMV sobre chiringuitos financieros…»). Inglés
  «CNMV exposes XTB and PJT clones among 9 unlicensed firms» (56): fiel.

## 2 · Robinhood Assets (Jersey), suplemento del 09/11 · corregir el titular en castellano

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- 09:22:46 UTC · HTTP 200 · application/pdf · SHA-256 `978eea67a47d5bb6…` (igual que el 10/11)
- Literal: «Supplement dated 09 November 2026 to the Base Prospectus dated 25 June
  2026» y «This Supplement has been approved by the Financial Market
  Authority Liechtenstein (the "FMA") on 09 November 2026».
- Punto (1)(C): «the Issuer is permitted to pass on certain fees and costs
  charged to the Issuer in connection with an Underlying to Investors, which
  may include proportionately reducing the number of Products held by such
  Investors». Y en el riesgo 3.2: «Such fees will be deducted by reducing the
  number of Products held by the Investor».
- **Por qué corrijo.** El titular «Stock Tokens de Robinhood: el emisor podrá
  restar tokens» no dice por qué. La fuente solo lo permite para repercutir
  costes ligados al subyacente; sin «por costes» parece que el emisor pueda
  restar tokens sin más. El inglés del mismo día («the issuer may cut tokens
  for costs») sí lo dice: los dos idiomas no decían lo mismo.
  - Antes: «Stock Tokens de Robinhood: el emisor podrá restar tokens» (56)
  - Ahora: «Robinhood: su emisor podrá restar Stock Tokens por costes» (57)
  - Sigue siendo el emisor el sujeto y no habla de «te» (en España se venden
    los «Classic», como dice el «por qué importa»). `en.titulo` sin cambios.
- Nombre «Stock Tokens»: el suplemento no usa esa marca (habla de
  «Products»), pero el emisor sí, en https://robinhood.com/rhj/stocktokens?lang=en
  (09:24:17 UTC, HTTP 200, SHA-256 `0a8ea1b8790c989e…`): «Stock Tokens are
  tokenized debt securities issued by Robinhood Assets (Jersey) Limited». Así
  que «tokens de deuda» y el nombre son correctos.
- Notificado a España: registro de folletos de ESMA
  (`registers.esma.europa.eu/solr/esma_registers_priii_documents`,
  `party_name:*ROBINHOOD*` y `document_type:SUPP`, 09:23:40 UTC, HTTP 200):
  «SUPP-69», «approval_filing_date 2026-11-09», con SPAIN entre los Estados
  notificados.
- Lo que vende Robinhood en España: https://robinhood.com/eu/es/invest/
  (09:22:52 UTC, HTTP 200, SHA-256 `6481f95e1298356e…`, HTML dinámico):
  «Explora más de 2.000 Classic Stock Tokens vinculados a acciones y ETP de
  EE. UU.…». «Solo vende hoy los «Classic»» se sostiene.
- «Un plan que el folleto ya recogía en junio»: «The Issuer anticipates
  appointing Robinhood Europe, UAB as an Authorised Participant in the near
  future» solo sale en la parte consolidada, fuera del suplemento (como se
  comprobó el 10/11). Correcto.
- Sección «importante»: es del 09/11, no del 10 u 11. Correcto.

## 3 · CNMV, ERIR de Minos Securities (Prosegur Cash) · confirmada

- URL: https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A23875529&lang=es
- 09:22:46 UTC · HTTP 200 · SHA-256 `6d7eb7cbca433bc8…` (igual que el 10/11)
- Literal: «06/11/2026 PROSEGUR CASH, S.A. Inscribir en el Registro Oficial …
  a MINOS SECURITIES, A.V., S.A. como entidad responsable de la inscripción y
  del registro de la emisión de pagarés representada mediante sistemas
  basados en tecnología de registros distribuidos, denominara "1ª Emisión de
  Pagarés Prosegur Cash 2026" por importe de 500.000 euros».
- Aviso: «no implica que la CNMV haya validado las condiciones de la emisión
  ni la información facilitada por el emisor».
- Titular «Prosegur Cash tokeniza 500.000 € en pagarés» (43): fiel. «No hemos
  hallado documento público» queda como ausencia no probada, bien dicho.

## 4 · Consejo de la UE, tope del régimen piloto DLT · confirmada

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
- 09:22:47 UTC · HTTP 200 · application/pdf · SHA-256 `757b8851957af55c…` (igual que el 10/11)
- Considerando 76: «an aggregate cap that limits the total value of financial
  instruments intermediated by a DLT market infrastructure of EUR 6 billion.
  Those activity thresholds have made it difficult for certain large market
  participants … Therefore, all asset-specific caps should be withdrawn,
  whereas the aggregate cap should be raised to EUR 300 billion».
- ST 14900/26, https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf
  (09:22:49 UTC, HTTP 200, SHA-256 `54f5eeefda10ae00…`): «General approach
  approved by Coreper. Part 2, on 04.11.2026». Fecha 04/11, correcta.
- Titular «Mercados DLT: los Veintisiete piden un tope 50 veces mayor» (58):
  300.000 / 6.000 = 50; «piden» = posición del Consejo (los Estados), no ley.
  Inglés «DLT markets: EU states want a cap 50 times higher» (49): fiel.

## 5 · CNMV autoriza Bit2Me STX · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- 09:22:49 UTC · HTTP 200 · application/pdf · SHA-256 `e09fadd373bf3621…` (igual que el 10/11)
- Literal: «28 de octubre de 2026 … La infraestructura, denominada Bit2MeSTX,
  será operada por Bit2Me Security Tokens Exchange STX, A.V., S.A.» y «En
  Bit2MeSTX se podrán negociar acciones y bonos representados en TRD».
- Lista de ESMA, https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
  (09:22:51 UTC, HTTP 200, SHA-256 `8f223820d3223598…`): solo dos de Spain,
  «Securitize Europe DLT TSS … 26 November 2025» y «Bit2Me STX DLT TSS … 27
  October 2026». «España ya tiene dos» es exacto.

## 6 · CNMV, consulta sobre reclamaciones · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- 09:22:50 UTC · HTTP 200 · application/pdf · SHA-256 `289265b26b53f727…` (igual que el 10/11)
- Literal: «15 de octubre de 2026», «proyecto de Circular», «Ampliar dicho
  procedimiento a las reclamaciones derivadas de la prestación de servicios
  de criptoactivos y de financiación participativa» y «Los comentarios pueden
  enviarse por escrito hasta el próximo 16 de noviembre de 2026».
- Titular «Quejas contra plataformas cripto: la CNMV quiere atenderlas» (59):
  «quiere» deja claro que es un proyecto. Nombra solo la parte cripto; el
  resumen añade la financiación participativa. Inglés «Spain's CNMV proposes
  taking your crypto platform complaints» (60): fiel.

## Comprobaciones generales

- `validarNoticias()` acepta el JSON corregido (6 noticias).
- Titulares de 60 caracteres como mucho en los dos idiomas (máximo: 60).
- Fuente primaria en las seis (regulador o emisor); ninguna se apoya en prensa.
- `fecha` es la del hecho y `consultadaEl` la de consulta (11/11) en todas.
- Ninguna noticia da precios, promete rentabilidad ni recomienda comprar.
- No he tocado git, Supabase ni la web publicada.
