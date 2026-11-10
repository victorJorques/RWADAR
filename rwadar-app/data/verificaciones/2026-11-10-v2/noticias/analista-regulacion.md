# Noticias · analista de regulación · 10/11/2026

Encargo: candidatas para la sección de noticias de Inicio. Lo que en los
últimos 30 días (desde el 11/10/2026) afecta a la tokenización y a quien
invierte desde España: autorizaciones, registros, advertencias, consultas,
guías y cambios normativos. Todas las fuentes se abrieron hoy entre las 15:30 y
las 15:36 UTC con curl (o WebFetch cuando curl no bastó). Las copias están en
`noticias/fuentes/regulacion/`. No incluyo nombres de personas físicas (algunos
documentos los traen: un portavoz de ESMA y los ponentes del Parlamento
Europeo).

Empecé releyendo `grupos/ampliacion/barrido-*.md`, los `resumen-*.md` y
`DECISIONES-COORDINADOR.md`. De ahí salen tres pistas (Seturion, Bit2Me STX y el
suplemento de Robinhood Assets (Jersey)), que he vuelto a abrir en su fuente
primaria. El resto es nuevo.

## Candidatas (de más a menos importante para el inversor en España)

| # | Fecha del hecho | Hecho | Fuente primaria | Hora UTC |
|---|---|---|---|---|
| 1 | 28/10/2026 | La CNMV autoriza Bit2Me STX, segundo sistema DLT de negociación y liquidación (SNL) en España bajo el régimen piloto. ESMA lo inscribe con fecha 27/10/2026. | Nota de prensa de la CNMV (PDF) + lista de ESMA | 15:34 / 15:30 |
| 2 | 04/11/2026 | El Coreper aprueba la orientación general del Consejo sobre el paquete de integración de mercados (MISP). El texto sube el límite del régimen piloto DLT de 6.000 a 300.000 millones de euros. Iba como punto «A» al ECOFIN del 09/11. | Consejo de la UE, ST 14900/26 (orden del día) y ST 13779/1/26 REV 1 (texto) | 15:31 / 15:32 |
| 3 | 15/10/2026 | La CNMV abre a consulta una Circular para tramitar las reclamaciones contra proveedores de criptoactivos y plataformas de financiación participativa. Se puede comentar hasta el 16/11/2026. | Nota de prensa de la CNMV (PDF) | 15:34 |
| 4 | 09/11/2026 | El BCE, la Comisión Europea y ESMA buscan miembros para el European Tokenisation Standards Group (ETSG): estándares comunes para la tokenización mayorista. Plazo hasta el 27/11/2026. | Noticia de ESMA | 15:34 |
| 5 | 16/10/2026 | BaFin concede a Seturion (Börse Stuttgart) la licencia de sistema DLT de negociación y liquidación. Es la primera de un grupo bursátil. | Lista de ESMA de infraestructuras DLT autorizadas (PDF del 04/11) | 15:30 |
| 6 | 09/11/2026 | La FMA de Liechtenstein aprueba un suplemento del folleto de los Stock Tokens de Robinhood Assets (Jersey). El folleto tiene pasaporte a España. El emisor prevé nombrar a Robinhood Europe, UAB como participante autorizado y podrá cobrar costes reduciendo el número de tokens. | Suplemento (PDF del emisor) | 15:35 |
| 7 | 16/10/2026 | ESMA publica su Q&A 2950 sobre plataformas de financiación participativa que cobran cuota de socio o de acceso («clubes de inversión»). | Q&A de ESMA | 15:35 |
| 8 | 06/11/2026 | Abanca, primer banco español del listado de la CNMV que puede prestar servicios MiCA (custodia, recepción y transmisión de órdenes y transferencias). Webull Securities (Europe) entra el 01/11. | Listado de proveedores de criptoactivos de la CNMV (PDF del 09/11) | 15:33 |
| 9 | 10/11/2026 | **Hoy.** La CNMV advierte de 9 entidades no registradas, dos de ellas clones de firmas registradas. Ninguna es una plataforma de tokenización. | Nota de advertencias de la CNMV (PDF) | 15:33 |
| 10 | 28/10/2026 | La CNMV publica de nuevo, completo, su documento de preguntas y respuestas sobre folletos («Listing Act», Easy Access). | Nota de prensa de la CNMV (PDF) | 15:34 |

### Detalle y citas

1. **Bit2Me STX.** CNMV, 28/10: «El Consejo de la CNMV ha autorizado el Sistema
   de Negociación y Liquidación, SNL, basado en Tecnología de Registros
   Distribuidos». Y: «En Bit2MeSTX se podrán negociar acciones y bonos
   representados en TRD». Lo opera Bit2Me Security Tokens Exchange STX, A.V.,
   S.A. En la lista de ESMA (PDF creado el 04/11/2026) figura como «Bit2Me STX
   DLT TSS · Spain · CNMV · 27 October 2026». El primero en España fue
   Securitize Europe (26/11/2025). Ojo: la autorización es de la
   infraestructura, no de una emisión. El bono de Valorix sigue sin documento
   de emisión (`espana-proximas`).
   URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
   SHA-256 `e09fadd3…7727`.
2. **MISP / régimen piloto.** ST 14900/26 (06/11), lista de puntos «A» del
   ECOFIN del 09/11/2026: «Market integration and supervision package … General
   approach approved by Coreper. Part 2, on 04.11.2026». El texto de la
   orientación general (ST 13779/1/26 REV 1, 30/10), considerando 76: «all
   asset-specific caps should be withdrawn, whereas the aggregate cap should be
   raised to EUR 300 billion». Se puede llegar a 500.000 millones por acto
   delegado. **No pude confirmar el resultado del ECOFIN del 09/11**: la web del
   Consejo da 403 (comprobación de navegador) por curl y por WebFetch. Por eso
   la fecha firme es la del Coreper (04/11). Es la posición del Consejo, no una
   ley: falta negociar con el Parlamento, que no ha fijado aún su posición
   (ST 15099/26, punto 5).
   URL texto: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf (SHA-256 `757b8851…8499`).
   URL orden del día: https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf (SHA-256 `54f5eeef…b2b7`).
   Contexto de prensa (no usado como fuente): Ledger Insights, 12/10/2026,
   dice que el BCE se opone a los 300.000 millones. No busqué la opinión
   oficial del BCE.
3. **Reclamaciones contra proveedores de criptoactivos y plataformas de
   financiación participativa.** CNMV, 15/10: «Ampliar dicho procedimiento a
   las reclamaciones derivadas de la prestación de servicios de criptoactivos y
   de financiación participativa». Los comentarios se admiten «hasta el próximo
   16 de noviembre de 2026». Es un proyecto, no está en vigor.
   URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
   SHA-256 `289265b2…e58`.
4. **ETSG.** ESMA, 09/11: el grupo «will bring together industry stakeholders
   to develop common standards for an interconnected tokenised financial
   ecosystem». Lo presiden representantes de la industria, con el BCE, la
   Comisión y ESMA como observadores. Va dirigido a «wholesale financial
   industry stakeholders» y el plazo acaba el 27/11/2026. No afecta
   directamente al minorista.
   URL: https://www.esma.europa.eu/press-news/esma-news/eu-seeks-nominations-stakeholder-group-tokenisation-standards-finance
   SHA-256 `d172fea1…c17b`.
5. **Seturion.** Lista de ESMA: «Baden-Württembergische Wertpapierbörse GmbH ·
   Seturion · DLT Trading & Settlement System · Germany · Federal Financial
   Supervisory Authority (BaFin) · 16 October 2026». La nota de la empresa
   (20/10) solo la pude leer en Mondo Visione: boerse-stuttgart.de da 403. Por
   eso cito el registro de ESMA. Ninguna emisión para particulares publicada
   (`barrido-brokers`).
   URL: https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
   SHA-256 `8f223820…c1fc` (PDF creado el 04/11/2026 y modificado el
   05/11/2026, aunque la ruta dice 2026-01).
6. **Robinhood Assets (Jersey).** Suplemento: «This Supplement has been approved
   by the Financial Market Authority Liechtenstein (the "FMA") on 09 November
   2026». Y: «The Issuer anticipates appointing Robinhood Europe, UAB as an
   Authorised Participant in the near future». Entre sus fines: el emisor
   podrá repercutir costes del subyacente a los inversores, «which may include
   proportionately reducing the number of Products held». Hoy el único
   oferente autorizado es Bitstamp Global Ltd (BVI) y la app española solo
   ofrece los Classic (`barrido-novedades`). Es la misma huella que esta
   mañana: `978eea67…29b9`.
   URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
7. **Q&A 2950 de ESMA.** Las cuotas de socio no impiden por sí solas ser
   «publicly accessible». Pero ESMA dice que pueden «raise investor protection
   concerns» cuando se exigen antes de dar acceso a la información clave,
   cuando no se dice a quién van o cuando crean conflictos de interés
   (finfluencers). Afecta a las plataformas de financiación participativa,
   incluidas las que ofrecen bonos tokenizados.
   URL: https://www.esma.europa.eu/publications-data/questions-answers/2950
   SHA-256 `20be52a6…79cd`.
8. **Listado de proveedores de criptoactivos de la CNMV** (PDF creado el
   09/11/2026): «ABANCA CORPORACIÓN BANCARIA, S.A. · ENTIDAD DE CRÉDITO
   (ESPAÑA) · … Recepción y transmisión órdenes · 06/11/2026». También
   «WEBULL SECURITIES (EUROPE) B.V. · PSC EN RÉGIMEN DE LP (País de origen:
   PAISES BAJOS) · 01/11/2026». Es cripto, no activos reales: sirve de
   contexto (bancos españoles dentro de MiCA). No comprobé si Abanca ya ofrece
   el servicio. Prakma Markets (09/10) queda fuera de la ventana de 30 días.
   URL: https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf
   SHA-256 `188c6935…00b6`.
9. **Advertencias de hoy.** CNMV, 10/11: «La Comisión Nacional del Mercado de
   Valores (CNMV) advierte sobre las siguientes entidades». Entre ellas hay
   clones de XTB y de PJT Partners. Ninguna vende activos tokenizados: es
   solo la noticia «del día» de protección del inversor. En las notas del
   03/11 y del 28/10 tampoco hay plataformas de tokenización.
   URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7b512d6e8c-0490-4a9b-a9f3-b44776391f76%7d
   SHA-256 `d6d617a4…0755`.
10. **Preguntas y respuestas sobre folletos.** CNMV, 28/10: «se ha hecho una
    actualización completa del documento». Trata Easy Access, el folleto en
    documentos separados y los bonos verdes. No menciona la tokenización:
    relevancia baja.
    URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb85b6ac4-b856-4277-aba7-b57fc6a37ac0%7d
    SHA-256 `b06b92ab…564`.

## Fuera de la ventana o descartadas

- **ESMA, call for evidence sobre colateral tokenizado en entidades de
  contrapartida central (09/10/2026).** Queda fuera por dos días y es
  mayorista. Plazo hasta el 15/01/2027.
- **ESMA, opinión sobre stablecoins no autorizadas (08/10/2026).** Fuera de la
  ventana. Los proveedores MiCA deben dejar de dar servicios con stablecoins
  no conformes.
- **ESMA, prioridad supervisora de innovación (IA y tokenización) desde 2027
  (23/09/2026)** y **respuesta de ESMA a la revisión de MiCA (30/09/2026).**
  Fuera de la ventana.
- **Pontes del Eurosistema, lanzado el 21/09/2026** (según la página del BCE,
  vista solo en el buscador). Fuera de la ventana y mayorista.
- **CNMV, Circular contable de infraestructuras de mercado (21/10)**,
  **jornada sobre mercados privados (27/10)** y **código de buen gobierno
  (03/11).** No tratan la tokenización.
- **Banco de España, Hacienda (DAC8) y Comisión (informe de revisión de
  MiCA).** No encontré nada oficial en la ventana. El informe de revisión de
  MiCA se espera para el 30/06/2027 según la prensa.
- **Folleto base de Ondo Global Markets.** Según `candidatas-mercados`, cumple
  12 meses el 11/11 y no hay uno nuevo en ESMA. Es un hecho futuro (mañana) y
  no lo he comprobado yo: queda para mañana.

## Fallos

- consilium.europa.eu (página del ECOFIN del 09/11): 403 por comprobación de
  navegador, con curl y con WebFetch. data.consilium.europa.eu sí responde.
- boerse-stuttgart.de: 403 con curl y con WebFetch.
- cnmv.es/portal/Publicaciones/Notas-de-prensa: 403. El listado sí funciona en
  `cnmv.es/portal/aldia/notasprensa.aspx?tipoNP=1` (notas) y `tipoNP=5`
  (advertencias).
- Listado de notas de prensa del BCE: se carga por JS y no lo pude leer.
