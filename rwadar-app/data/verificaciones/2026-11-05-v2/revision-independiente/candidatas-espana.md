# Revisión independiente · grupo candidatas-espana · 05/11/2026

Revisor independiente: no preparé estos expedientes. Abrí yo mismo las fuentes
primarias el **05/11/2026 entre las 08:22 y las 08:34 UTC**, con `curl`,
`pdftotext` y Playwright. Las copias están en
`fuentes/candidatas-espana/` y cada lectura en
`fuentes/candidatas-espana/inventario-consultas.json` (URL, hora UTC, código
HTTP, tamaño y sha256). No inicié sesión, no rellené formularios y no toqué los
expedientes.

## En una frase

**Las cuatro decisiones `no_admitir` se sostienen.** Casi todo lo que dice el
investigador es cierto, pero hay que corregir varios detalles. Los más
importantes: en la CNMV **sí se puede leer** para qué clientes está autorizada
cada agencia (Bit2Me STX y Token City pueden colocar valores a minoristas); la
salida de Hausera ETI omite un **límite de reembolso**; y el registro de folletos
de **ESMA confirma** la aprobación del folleto de Altarius y su notificación a
España, así que ese bloqueo queda resuelto.

**Veredicto global: aprobado con cambios.** No hay altas (`admitir_propuesta`)
ni retiradas (`retirar_propuesta`) en este grupo. Las correcciones no cambian
ninguna decisión ni llegan a ninguna tarjeta publicada.

## 1. Bit2Me STX · bono de Valorix (`bit2me-stx-bono-valorix`)

### Estado: próxima (diciembre de 2026, sin documento) → igual · **confirmado**

- Nota de prensa del 28/10/2026
  (https://blog.bit2me.com/es/bit2me-stx-obtiene-la-autorizacion-de-la-cnmv-para-lanzar-su-bolsa-de-valores-nativa-en-blockchain/),
  leída a las 08:22:19 UTC. Su sha256 (`c3b80c67…`) es **idéntico** al del
  investigador. `datePublished` 2026-10-28T09:00:27+01:00. Literal: «un bono
  corporativo tokenizado de 1 millón de euros, dirigido a inversores elegibles
  conforme a la normativa de emisión aplicable, previsto para diciembre de
  2026, que cotizará posteriormente en el mercado secundario».
- Página de producto https://bit2me.com/es/stx (08:22:19 UTC): sha256
  **idéntico** (`81b2b4d5…`). Sigue con las condiciones del sandbox: «el
  importe mínimo para participar es de 1.000 EUR por usuario», «las retiradas
  de los fondos están deshabilitadas hasta la finalización de las pruebas del
  Sandbox».
- FAQ https://support.bit2me.com/es/support/solutions/articles/35000266706
  (08:22:19 UTC): «Modificado el Vie, 24 Oct, 2025». Mismo contenido: mínimo
  de 1.000 €, comisión del 0,2 %, residencia en España, solo para la prueba de
  2024. El sha256 del HTML cambia, pero el texto no.
- Registro ERIR (Ursus-3), página 3
  (https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A86796182&lang=es&page=2,
  08:22:49 UTC): entrada del 31/10/2025, obligaciones de 500.000 € «realizada
  por ACTIVOS Y VALORES DIGITALES, S.A. (Valorix)». Ojo: la CNMV la titula
  **«VALORIX DIGITAL, S.A.»**. Hay 23 inscripciones (10 + 10 + 3) y la última
  es del 23/10/2026 (Hausera SPV 7 y 8). Ninguna es de Valorix después de
  2025.
- Ficha CNMV
  (https://www.cnmv.es/portal/consultas/esi/esis.aspx?nif=A56759137&lang=es,
  08:22:19 UTC): «343 · 18/09/2026», FOGAIN, Paseo de la Castellana 144.
- Matiz: según el investigador, stx.bit2me.com no tiene «contenido público
  legible». Con navegador (08:28:51 UTC) la portada sin sesión enseña un libro
  de órdenes de demostración, «Wallapop · WPOP | ES0000000001», con
  operaciones del «19-02-2024». No hay ninguna emisión de Valorix. Esa
  demostración no se puede usar como dato.
- Por descubrimiento (WebSearch, no es fuente primaria): la prensa repite el
  anuncio. No hay documento de emisión público.

### Licencia: programa de actividades leído; «casillas de tipo de cliente ilegibles» · **confirmado con cambios**

- Pestaña «Programa de actividades» de la misma ficha, leída con Playwright a
  las 08:24:38 UTC (`cnmv/programa-bit2me-stx-tabla.txt`). Las restricciones
  son las que dice el investigador: «Se restringe a la prestación del servicio
  respecto de los valores negociables […] representados mediante sistemas
  basados en tecnología de registros distribuidos» (colocación, gestión del
  mercado, que será «sistema de negociación y liquidación (SNL)», y custodia).
- **Corrección:** las casillas de tipo de cliente **sí se pueden leer**. Son
  imágenes con `alt="Si"`. Colocación, gestión del sistema de negociación,
  custodia y asesoramiento: **Minoristas Sí · Profesionales Sí · Contrapartes
  elegibles Sí**. Además, «La sociedad mantiene fondos en cuentas
  instrumentales y transitorias a nombre de sus clientes»: **Sí**.
- Relación de infraestructuras
  (https://www.cnmv.es/portal/consultas/Rectoras/ListadosIM.aspx?lang=es,
  08:22:19 UTC): siguen dos SNL TRD, «Bit2Me STX (SNL TRD)» y «SECURITZE (SNL
  TRD)».
- La licencia permite colocar a minoristas, pero eso no dice nada del bono de
  diciembre: los «inversores elegibles» siguen sin definir. La decisión no
  cambia.

## 2. Hausera ETI en Portfolio (`hausera-eti-portfolio`)

### Documentos localizados · **confirmado**

Bajé hoy los cuatro documentos de `api.portfolio.exchange` (08:24:50–08:25:07
UTC). Los cuatro sha256 son **idénticos** a los del expediente:

| Documento | URL | sha256 | Fecha en Portfolio |
|---|---|---|---|
| KID en español, revisado el 17/03/2026, 3 páginas | https://api.portfolio.exchange/poex/document/28108 | `f2bd05c8…` | 23/03/2026 |
| Condiciones finales, serie 19, 28 páginas | https://api.portfolio.exchange/poex/document/25118 | `262ada0d…` | 11/02/2026 |
| Folleto base de Altarius ETI AG (5,98 MB, solo texto) | https://api.portfolio.exchange/poex/document/25075 | `b8be61a1…` | 10/02/2026 |
| Aviso de pago «Other Cash Distributions» | https://api.portfolio.exchange/poex/document/49667 | `25e7639e…` | 27/10/2026 (PDF creado el 27/10/2026 a las 11:09 UTC) |

### Licencia y registro · **confirmado con cambios**

- Relación de infraestructuras de la CNMV (08:22:19 UTC): «EUROPEAN DIGITAL
  SECURITIES EXCHANGE, S.V., S.A. · Portfolio Stock Exchange (SMN) · Sistema
  multilateral de negociación». En el listado de sociedades y agencias de
  valores (08:26:06 UTC): «314 - 13/01/2023».
- Condiciones finales, Parte B, apartado 3: «The Liechtenstein Financial
  Market Authority has provided the competent authorities of the host member
  states; Liechtenstein, Germany, and Spain with a certificate of approval».
- **Novedad: ahora con registro oficial.** Consulté el registro de folletos de
  **ESMA** (`hausera/esma-registro-folletos.txt`):
  - folleto base BPWO-72 de «Altarius ETI AG - 5299001XE1CIMMOEME82»: Estado
    de origen Liechtenstein, `approval_filing_date` 2025-12-18, pasaportado a
    «GERMANY,SPAIN» el 2026-02-06 (08:31:14 UTC);
  - condiciones finales FTWS-680 de ISIN FR0014010H19: presentadas el
    2026-02-11 y pasaportadas a «GERMANY,SPAIN» (08:31:21 UTC).

  Hay que quitar el bloqueo «No se consultó el registro de folletos…» y añadir
  este registro a `registros`.

### Derecho/token: nota perpetua al portador en Euroclear, sin token · **confirmado**

- Condiciones finales: «18. Maturity: Perpetual», «23. Relevant Clearing
  System: Euroclear», «27. Form of ETI Securities: Bearer ETI Securities»,
  «24. Underlying Issuer: Altarius Index PCC Limited- Cell N (Hausera Portfolio
  Linked Notes)», «25. … (ISIN: GI000A4ANPR9)».
- Busqué en el texto extraído «token», «blockchain», «distributed ledger» y
  «DLT»: **0 resultados** en el folleto base y en las condiciones finales.
- KID: «instrumento de deuda derivado con cupón cero que no devenga intereses
  y no cuenta con protección de capital».
- El aviso del 27/10 dice que el pago «does not constitute a coupon payment»:
  5,83333333 € por título, fecha de pago 3 de noviembre de 2026. Lo anoto, pero
  no es una rentabilidad publicable.

### Acceso: oferta pública en España, producto complejo, riesgo 6/7 · **confirmado**

- Condiciones finales, Parte B, apartado 6: «An offer of the ETI Securities may
  be made […] in Liechtenstein, Germany, and Spain». Además: «the ETI
  Securities may be offered to all categories of investors», y el mercado
  objetivo MiFID incluye «retail clients».
- KID: «producto complejo y está destinado únicamente a inversores
  informados», «clase de riesgo 6 en una escala de 7».
- La ficha de Portfolio (08:24:50 UTC) avisa: «no resulta conveniente para
  usted, conforme al resultado del test de conveniencia que le hemos
  realizado».

### Salida: venta en Portfolio (sin órdenes de compra) o reembolso anual el 31/12 · **confirmado con cambios**

- Ficha
  https://portfolio.exchange/es/portfolio-market/hausera-eti-HAUS-FR0014010H19-41
  (08:24:50 UTC): «Órdenes de compra activas · No hay órdenes activas». Única
  orden de venta: «2.000,00 € · 989,40 € / 98,94 %». Último precio: «960,00 €
  96 %», sin fecha.
- Condiciones finales: «29. Standard Redemption Day(s): 31st December of each
  year».
- **Falta en el expediente y en la tarjeta: el reembolso está limitado.**
  Condiciones finales, resumen en español: «sujeto a un límite de reembolso
  del máximo entre el 0.50% del NAV o 1 unidad del Valor ETI del NAV en esa
  Fecha Contable». Si se pasa del límite, las solicitudes se recortan a
  prorrata y el resto pasa a la siguiente fecha. Además, el emisor debe pedir
  el reembolso al emisor subyacente «al menos 30 días antes». Hay que añadirlo a
  la nota de salida y a `resumenTarjeta.salida`.

### Comisiones en conflicto e ISIN de otra serie · **confirmado con cambios**

- KID: «Otros costes corrientes(b) 0.00%», entrada y salida 0,14 % y
  «Participaciones en cuenta 100.00% … por encima de un rendimiento superior
  al 12%».
- Condiciones finales: «8. Arranger Fee: Maximum of 0,75% of NAV(t) per annum
  or 47.500,00 EUR per annum as set out in the relevant PPM of the Underlying
  Security» y «9. Calculation Agency Fee: Maximum of 0,15% … or 28.000,00 EUR
  per annum».
- Matiz que hay que recoger: decir «hasta 0,90 % anual» simplifica. Cada
  comisión puede ser un porcentaje **o** un importe fijo, y se cobra en el
  subyacente según su PPM. La nota (b) del KID dice que la nota subyacente
  «cobra una tarifa fija todo incluido». El conflicto sigue: no se usa ninguna
  cifra.
- ISIN: el apartado 11 dice literalmente «11. FR0014012HS6 FR0014012HS6». En
  la pestaña ETP/Deuda de Portfolio (08:29:25 UTC), FR0014012HS6 es «Hausera
  Madrid 2 ETI» (HMII). **Error del documento confirmado.**

### Decisión `no_admitir`

Es defendible. El producto existe y se puede comprar en España, pero no es un
activo tokenizado. Además, es complejo (riesgo 6/7), no tiene vencimiento,
hoy no tiene órdenes de compra, su reembolso está limitado y sus documentos se
contradicen.

## 3. BeToken (`beself-brands-betoken`)

### Corrección del estado: «terminó en septiembre de 2025» → no consta · **confirmado**

- GitBook del emisor, https://betoken-1.gitbook.io/papers/whitepaper/periodo-de-venta.md
  (08:26:06 UTC): «Segunda venta · Inicio: 15 de septiembre de 2025 · Termina:
  Al final de la colocación de todos los tokens.»
- Documento de oferta en PDF
  (https://content.gitbook.com/content/0aYXo7y0jkozXKEdhHg8/blobs/7hAvNhp8E8k8Tajoj766/BeselfBrands_Whitepaper.pdf,
  08:26:40 UTC, 37 páginas, sha256 `e5e16d1d…`, **idéntico**). Solo da fechas
  de inicio: «Fase 2: Subfase primera: 8 de septiembre de 2025. Subfase
  segunda: 15 de septiembre de 2025». Añade: «En el caso que alguno de los
  Tokens no se coloque en una subfase, se ofrecerán de nuevo en la siguiente».
  Ninguna de las dos fuentes dice que la venta terminara en septiembre de 2025:
  la corrección es correcta.
- El PDF contiene DNI. Lo leí en una carpeta temporal del scratchpad y lo borré
  enseguida. Solo anoto su sha256.

### Acceso: webs de venta caídas → igual · **confirmado**

- https://betoken.io/: «Connection reset by peer» con curl (08:26:06 UTC) y
  HTTP 502 «upstream request failed» con navegador (08:28:56 UTC).
- https://beselfbrands.com/ y https://www.beselfbrands.com/: «error code: 522»
  (08:26:06 UTC).

### Documento de oferta releído; mínimo de 100 €; sin mercado secundario · **confirmado**

- PDF: «Inversión mínima: 100,00.- €» y apartado 2.3.3 («inversión mínima de
  cien Euros»). Sobre la salida: «Beself Brands, en cuanto esté disponible,
  tramitará los documentos necesarios para permitir que sus accionistas […]
  puedan negociar en un mercado secundario (exchange)».
- GitBook «Transmisibilidad»: solo se pueden transmitir a quien haya
  completado el KYC y «superado un proceso de evaluación individualizada que
  llevará a cabo el Emisor».
- ERIR, página 3 (08:22:49 UTC): «11/07/2025 · BESELF BRANDS, S.L. · Emisión
  de acciones por importe de 7.962.816€».
- EAF nº 147 (https://www.cnmv.es/portal/consultas/listadoentidad.aspx?id=1&tipoent=2&lang=es,
  08:26:06 UTC): «GABRIEL CARRILLO CAPEL EAF, S.L. · 147 - 27/06/2014».

## 4. Token City · CANDO1 (`token-city-exchange-cando1`)

### Nueva: CANDO1 «en estudio», solo con lista · **confirmado**

- https://exchange.token-city.com/ (curl a las 08:22:49 UTC y navegador a las
  08:28:54 UTC): «Oportunidades de inversión Próximamente […] CANDO1 (CDO1) En
  estudio […] la Sociedad LORNIN IBÉRICA S.L. ha promovido y desarrollado un
  complejo de Senior Living premium en La Moraleja (Madrid), compuesto por 76
  apartamentos […] Lista prioritaria».
- Ficha CNMV
  (https://www.cnmv.es/portal/consultas/esi/esis.aspx?nif=A25988981&lang=es,
  08:22:49 UTC): «TOKEN CITY EUROPEAN EXCHANGE A.V., S.A. · 334 · 06/02/2026»,
  FOGAIN, Calle de Henri Dunant 17.

### Cifras comerciales sin respaldo, sin documento ni ERIR · **confirmado con cambios**

- Mismas cifras en la portada: «Objetivo de emisión 1.971.000 € Token 1.971
  TIR bruta estimada ~11,7% anual Inversión mínima 657 €».
- **Además, no cuadran entre sí:** 1.971.000 € entre 1.971 tokens da 1.000 €
  por token, pero el mínimo es de 657 €. Es otro motivo para no usarlas.
- ERIR (3 páginas, 08:22:49 UTC): 23 inscripciones, ninguna de Lornin ni de
  CANDO. Advertencias de la CNMV (tipo «no autorizadas», 08:27 UTC): sin
  coincidencias para «Token City», «Lornin» y «Cando». El buscador funciona:
  con «Gemini» devuelve «GEMINI LTD FX» y «GEMINI OPTION LTD».
- **Corrección:** en el claim de importe, la frase «Por debajo de 5 M€: podría
  ir sin folleto aprobado» es una deducción del investigador. Las condiciones
  de Token City (https://exchange.token-city.com/es/condiciones, sha256
  idéntico `f6467674…`) solo dicen «Folleto registrado en la Comisión Nacional
  del Mercado de Valores, salvo en aquellos casos en los que no sea requerido,
  en los cuales se podrá acompañar el Documento de Admisión validado por una
  Empresa de Servicios de Inversión». No dan ningún umbral. Hay que quitar el
  «5 M€» o darle una fuente legal.
- Por descubrimiento (WebSearch, no es fuente primaria): Alimarket atribuye
  CANDO a JV20 y Yurbban, con CBRE como comercializador. Lornin Ibérica podría
  ser la sociedad del proyecto. Sin documento, el emisor sigue sin confirmar.

### Conflicto de licencia (SNL del régimen piloto) · **confirmado con cambios**

- Confirmado: el marketplace https://www.token-city.com/es/marketplace
  (08:22:49 UTC) dice «Agencia de Valores autorizada por la CNMV para operar un
  Sistema de Negociación y Liquidación bajo el Régimen Piloto de la UE». En
  la relación de infraestructuras de la CNMV solo hay dos SNL TRD (Bit2Me STX
  y Securitize), y Token City no aparece. Bolsamanía del 22/05/2026 (08:28:00
  UTC) dice que «prevé ampliar próximamente sus capacidades con la puesta en
  marcha de su Bolsa de Valores tokenizados bajo el Régimen Piloto Europeo».
- **Corrección:** decir que «solo consta la agencia de valores nº 334» se queda
  corto. Su programa de actividades (Playwright, 08:24:16 UTC) incluye:
  - «Gestión de sistemas multilaterales de negociación» para instrumentos con
    TRD, con Minoristas, Profesionales y Contrapartes en Sí;
  - colocación para **Minoristas Sí · Profesionales Sí** (Contrapartes sin
    marcar);
  - en las explicaciones, la frase «el sistema de negociación y liquidación
    gestionado por la AV».

  Las casillas de tipo de cliente **sí se leen** (imágenes con `alt="Si"`).
  Texto correcto: «inscrita como agencia de valores nº 334, con gestión de un
  SMN para valores con TRD en su programa, pero sin ningún SNL suyo en la lista
  de infraestructuras de la CNMV».

## 5. Los tres datos de la tarjeta (`resumenTarjeta`)

Ninguna de las cuatro lleva propuesta de tarjeta. Aun así, compruebo los textos
de referencia. Todos tienen 120 caracteres o menos, ninguno da rentabilidad ni
precio principal y todos están en castellano llano.

| Slug | Campo | Texto (caracteres) | Veredicto |
|---|---|---|---|
| bit2me | salida | «Anunciado: cotizará en Bit2Me STX tras emitirse; vencimiento y cupón sin publicar» (81) | Con cambios: la nota no dice en qué mercado cotizará. Propuesta: «Anunciado: cotizará después en un mercado secundario; vencimiento y cupón sin publicar» (86) |
| hausera | mínimo | «1 título de 1.000 € de nominal; en bolsa pagas el precio del día» (64) | Correcto (condiciones finales, apartado 16) |
| hausera | accesoEspana | «Oferta pública permitida en España; producto complejo, con test de conveniencia» (79) | Correcto (condiciones finales, Parte B 6; aviso de la ficha de Portfolio) |
| hausera | salida | «Vendes en Portfolio si alguien compra (hoy no hay órdenes de compra) o pides el reembolso anual del 31/12» (105) | **Con cambios obligatorios:** falta el límite de reembolso y «hoy» no lleva fecha. Propuesta: «Venta en Portfolio si hay comprador (sin órdenes de compra el 05/11) o reembolso anual el 31/12, con límites» (108) |
| betoken | mínimo | «100 € en las fases de venta de 2025; hoy no se puede comprobar si sigue a la venta» (82) | Con cambios: cambiar «hoy» por «el 05/11» |
| betoken | salida | «Sin mercado secundario: solo venta privada a otro inversor que acepte el emisor» (79) | Correcto (GitBook «Transmisibilidad») |
| tokencity | salida | «Sin mercado secundario hoy: Token City lo anuncia como «próximamente»» (69) | Con cambios: cambiar «hoy» por «a 05/11» |

## 6. Muestreo de lo que el investigador da «sin cambios»

- **Bit2Me STX, estado:** nota, página de producto y FAQ iguales (dos sha256
  idénticos y la FAQ con el mismo texto). ERIR y ficha nº 343, sin cambios.
  Confirmado.
- **BeToken, acceso:** las webs siguen caídas. El documento de oferta es el
  mismo (sha256 idéntico). Confirmado.
- **Registro ERIR del grupo («23 emisiones, sin inscripciones nuevas»):**
  10 + 10 + 3 = 23, la última del 23/10/2026. La página de entidades ERIR
  (https://www.cnmv.es/Portal/Consultas/ERIR.aspx?lang=es, 08:27:41 UTC) solo
  enumera «URSUS-3 CAPITAL, A.V., S.A.». Confirmado.

## Bloqueos (míos y del investigador)

- Documentos de emisión del bono de Valorix de diciembre y de CANDO1: siguen sin
  publicarse. Confirmado.
- valorix.es y www.valorix.es («Connection reset by peer»), minossecurities.com
  (reset) y openbrick.es (CONNECT 502), a las 08:22–08:31 UTC: siguen sin
  responder. Confirmado.
- Advertencias de «otras entidades» de la CNMV (`tipo=2`): HTTP 400 también hoy
  para mí (08:34:17 UTC, incluso con «Gemini»). Confirmado.
- **Resuelto por mí:** registro de folletos de la FMA o de los pasaportados (ver
  ESMA arriba). No consulté la web de la propia FMA, pero el registro de ESMA
  recoge lo que notifica la autoridad de origen.
- Conflicto de Bestinver Securities como ERIR: sigue sin resolver. La página
  ERIR de la CNMV solo enumera a Ursus-3. En el listado de sociedades de
  valores aparece «BESTINVER, SOCIEDAD DE VALORES, S.A.» (nº 205), y no una
  entidad llamada «Bestinver Securities».
- No vi la lista de «oferentes autorizados» en altariuseti.com: la portada
  responde, pero no la recorrí.

## Correcciones obligatorias (para el coordinador; yo no edito expedientes)

1. **bit2me-stx-bono-valorix**, `registros[0].alcance` y el cambio de licencia:
   cambiar «las casillas de tipo de cliente no se pueden leer» por «colocación,
   gestión del SNL y custodia: minoristas, profesionales y contrapartes
   elegibles = Sí (alt de la imagen); mantiene fondos en cuentas
   instrumentales = Sí». Propuesta para `resumenTarjeta.salida`: ver la tabla.
   Opcional: anotar que la CNMV titula la emisión ERIR de 2025 «VALORIX
   DIGITAL, S.A.».
2. **hausera-eti-portfolio**:
   - Añadir el límite de reembolso (máximo entre el 0,50 % del NAV o 1 título
     por fecha, con prorrateo y arrastre; aviso de 30 días) al claim `salida`,
     a `salidaExplicada` y a `resumenTarjeta.salida`.
   - Añadir el registro de ESMA (BPWO-72, aprobado el 18/12/2025, pasaportado
     a Alemania y España el 06/02/2026; FTWS-680 del 11/02/2026) a `registros`
     y quitar ese bloqueo.
   - Precisar que las comisiones son «porcentaje del NAV o importe fijo, según
     el PPM del subyacente».
3. **beself-brands-betoken**: cambiar «hoy» por la fecha en
   `resumenTarjeta.minimo`.
4. **token-city-exchange-cando1**:
   - Corregir `registros[0].alcance`: las casillas sí se leen y la colocación
     es para minoristas y profesionales.
   - Corregir el texto del conflicto de licencia y del resumen («solo consta la
     agencia de valores nº 334»): ver el texto correcto en el apartado 4.
   - Quitar o dar fuente al «5 M€» del claim `importe`.
   - Añadir que el mínimo (657 €) no cuadra con 1.971.000 € / 1.971 tokens.
   - Cambiar «hoy» por «a 05/11» en `resumenTarjeta.salida`.
5. **Resumen del grupo** (`resumen-candidatas-espana.md`), puntos 3 y
   «Conflictos»: cambiar «Las casillas de tipo de cliente son iconos y no se
   pueden leer» por lo leído arriba.
