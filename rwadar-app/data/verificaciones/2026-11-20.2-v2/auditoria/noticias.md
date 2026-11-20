# Auditoría independiente · ámbito «noticias» · 20/11/2026

Lo auditado: las 5 noticias de `rwadar-site/datos/noticias-v2.json` de la rama
`claude/catalogo-2026-11-20` (commit `38de846`, `actualizadoEl` 2026-11-20).
Auditor independiente: no elegí ni escribí estas noticias. Abrí yo mismo cada
fuente entre las **17:15 y las 17:23 UTC**, con peticiones normales (curl con
su agente por defecto; a la CNMV con `accept-language: es`), sin cuentas ni
trucos. Copias de trabajo fuera del repositorio, en
`/tmp/auditoria-2026-11-20/noticias/`.

## Resultado en una frase

**Las 5 noticias se sostienen hoy en su fuente**: las 5 fuentes responden con
HTTP 200 y **la misma huella SHA-256** que la edición de la mañana; fechas,
cifras, entidades y titulares cuadran, sin promesas ni nombres de personas.
No hay ningún hallazgo obligatorio. Dejo **2 mejoras recomendadas** de
claridad (Robinhood y Consejo). No falta nada muy importante de los últimos
7 días (CNMV, ESMA, Banco de España, Comisión, Consejo, BCE, EBA, Parlamento
Europeo y BOE del 13 al 20/11).

## Fuentes abiertas hoy

| Noticia | Hora UTC | HTTP | SHA-256 | ¿Igual que la mañana? |
| --- | --- | --- | --- | --- |
| `cnmv-advertencias-supervisores-ue-oro-sin-folleto` | 17:15:10 | 200 PDF | `6b1d350e69c262fa…da5f148820` | Sí |
| `cnmv-advertencias-9-entidades-dos-clones` | 17:15:11 | 200 PDF | `d80481e506caff1b…8600bbd355` | Sí |
| `robinhood-stock-tokens-suplemento` | 17:15:13 | 200 PDF | `978eea67a47d5bb6…ec710d29b9` | Sí |
| `consejo-ue-tope-regimen-piloto-dlt` | 17:15:13 | 200 PDF | `757b8851957af55c…999a498599` | Sí |
| `cnmv-autoriza-bit2me-stx` | 17:15:15 | 200 PDF | `e09fadd373bf3621…78e1717727` | Sí |

Fuentes de contraste, también de hoy:

- ESMA, registro de folletos (API pública Solr, 17:20:15 UTC):
  `party_name:*ROBINHOOD* AND document_type:SUPP` → **SUPP-69**, aprobado
  09/11/2026, primer pasaporte 09/11/2026 13:18:41 UTC, **SPAIN** entre los
  Estados notificados.
- Consejo de la UE, ST 14900/26 (lista de puntos «A» del ECOFIN, 17:16:37 UTC,
  SHA-256 `54f5eeef…da58eb2cb7`) y ST 15099/26 (nota de punto «A», 17:18:57 UTC).
- ESMA, lista de infraestructuras DLT autorizadas (17:18:30 UTC, SHA-256
  `8f223820…a830c1fc`, modificada el 05/11/2026).

## Noticia a noticia

### 1. Oro y acciones sin folleto: tres avisos llegan de Alemania (18/11) · confirmada

- PDF de la CNMV fechado «18 de noviembre de 2026», «Advertencia de entidades
  no registradas en supervisores internacionales». Tres filas, las tres de
  «BAFIN - ALEMANIA»:
  - «BAFIN ha prohibido a … la oferta al público de oro físico por no haber
    publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE…» → «prohibió a
    una firma ofrecer oro físico al público».
  - «BAFIN ha suspendido el ofrecimiento al público de valores en forma de
    acciones … por no haber publicado EL FOLLETO…» → «suspendió la oferta de
    acciones de otra».
  - «BAFIN tiene indicios que indican que … está ofreciendo un producto de
    inversión al público sin haber publicado EL FOLLETO…» → la tercera.
  - «Además, la web de la CNMV ofrece un buscador de entidades advertidas»
    respalda el consejo prudente del «Por qué te importa».
- Titular (58 / 55 caracteres), fecha, ámbito UE, foto `alerta-fraude` (tema
  avisos): bien. Sin nombres de personas (tampoco de las firmas).

### 2. 9 firmas sin registro; dos imitan a firmas registradas (16/11) · confirmada

- PDF de la CNMV fechado «16 de noviembre de 2026». Contadas una a una: 9
  entidades (algunas con varias webs). Dos marcadas «(clon)»: «No guarda
  relación con … EAF … debidamente registrada en España como Empresa de
  Asesoramiento Financiero» y «No guarda relación con … SCR S.A., debidamente
  registrada en España como Sociedad de Capital-Riesgo».
- «no figuran inscritas en el correspondiente registro de esta Comisión y, por
  tanto, no están autorizadas para prestar servicios de inversión» → resumen
  correcto.
- El buscador de advertencias funciona hoy (17:23:26 UTC, HTTP 200) y enseña la
  web buena de la firma imitada junto al clon.
- Titular (54 / 49), fecha, ámbito España, foto `pago-online`: bien.

### 3. Robinhood: el emisor podrá restarte Stock Tokens por costes (09/11) · confirmada (mejora recomendada)

- «This Supplement has been approved by the Financial Market Authority
  Liechtenstein (the "FMA") on 09 November 2026»; suplemento al «Base
  Prospectus dated 25 June 2026».
- «(C) the Issuer is permitted to pass on certain fees and costs charged to the
  Issuer in connection with an Underlying to Investors, which may include
  proportionately reducing the number of Products held by such Investors» →
  titular y resumen correctos.
- «from the date of this Supplement the Terms and Conditions applicable to
  Existing Products shall consist of … as modified by the amendments set out in
  this Supplement» → «vale también para los tokens ya emitidos, desde el 9 de
  noviembre», correcto.
- «The Products are debt securities, issued in the form of cryptographic
  tokens» → «tokens de deuda», correcto.
- «Notificado a España»: confirmado en el registro de ESMA (SUPP-69, SPAIN).
- «The Issuer anticipates appointing Robinhood Europe, UAB as an Authorised
  Participant in the near future» está en el folleto de junio que va anexo al
  mismo PDF: la segunda frase del «Por qué te importa» es cierta.
- **Recomendada (claridad):** esa segunda frase contesta a algo que el lector
  no ha leído (que la filial sea «participante autorizado» no sale ni en el
  titular ni en el resumen) y usa jerga. Propuesta, con la misma fuente:
  - `porQueImporta`: «El cambio vale también para los tokens ya emitidos, desde
    el 9 de noviembre: el número de tokens que tienes puede bajar para cubrir
    esos costes.» (144 caracteres)
  - `en.porQueImporta`: «The change also applies to tokens already issued,
    from 9 November: the number of tokens you hold may go down to cover those
    costs.» (130)

### 4. Mercados tokenizados: los 27 piden un tope 50 veces mayor (04/11) · confirmada (mejora recomendada)

- ST 13779/1/26 REV 1, considerando 76: «an aggregate cap that limits the total
  value of financial instruments intermediated by a DLT market infrastructure
  of EUR 6 billion. Those activity thresholds have made it difficult for
  certain large market participants … Therefore, all asset-specific caps should
  be withdrawn, whereas the aggregate cap should be raised to EUR 300 billion.»
  Y el nuevo art. 3.2: «shall not exceed EUR 300 billion». 300.000 / 6.000 =
  50: el titular cuadra.
- ST 14900/26: «General approach approved by Coreper. Part 2, on 04.11.2026»,
  como punto «A» del ECOFIN del 9 de noviembre de 2026 → la fecha 04/11 se
  sostiene.
- ST 15099/26: Coreper debía «recommend that the Council reach a general
  approach … through an 'A' item in the Economic and Financial Affairs Council
  of 9 November 2026, to enable the Presidency to conduct interinstitutional
  negotiations as soon as the European Parliament settles its own negotiating
  position». «Falta pactarla con el Parlamento Europeo» sigue siendo cierto:
  en las notas de prensa del Parlamento (RSS, 17:20:47 UTC) no hay nada de este
  paquete.
- **Recomendada (precisión):** el resumen dice que Coreper «aprobó la posición
  del Consejo»; según ST 15099/26, Coreper dio el visto bueno y la adopción
  formal estaba prevista por los ministros, sin debate, el 09/11. No he podido
  confirmar que el ECOFIN la adoptara (la web del Consejo responde 403 «Browser
  check»; no se insiste). Propuesta:
  - `resumen`: «Los embajadores de los Estados (Coreper) aprobaron el 04/11 la
    posición del Consejo, que los ministros debían adoptar sin debate el 09/11:
    quitar los topes por activo y elevar a 300.000 millones de euros el valor
    máximo que puede registrar o negociar cada infraestructura DLT.» (276)
  - `en.resumen`: «Member states' ambassadors (Coreper) approved the Council's
    position on 4 November, for ministers to adopt without debate on 9
    November: drop the per-asset caps and raise to €300bn the maximum value
    each DLT market infrastructure can record or trade.» (250)

### 5. España ya tiene dos mercados de valores tokenizados (28/10) · confirmada

- Nota de la CNMV del «28 de octubre de 2026»: «El Consejo de la CNMV ha
  autorizado el Sistema de Negociación y Liquidación, SNL, basado en Tecnología
  de Registros Distribuidos»; «será operada por Bit2Me Security Tokens Exchange
  STX, A.V., S.A.»; «se podrán negociar acciones y bonos representados en TRD»;
  régimen piloto del Reglamento (UE) 2022/858.
- Lista de ESMA (modificada el 05/11/2026): en España, **dos**: «Securitize
  Europe DLT TSS», desde el 26/11/2025, y «Bit2Me STX DLT TSS», desde el
  **27/10/2026** → «España suma dos con Securitize» y «ESMA la registra con
  fecha 27/10/2026», correctos. La CNMV no ha publicado ninguna otra
  autorización después (notas de prensa, 17:17:12 UTC).
- «No consta ninguna [emisión] con documento público para particulares»: no he
  hallado ninguna. La página pública de Bit2Me STX (17:18:39 UTC) solo enseña
  un proyecto del sandbox anterior.
- Foto `bolsa-madrid`: según `fotos.json`, un horizonte genérico de rascacielos,
  sin logotipos. No engaña.

## Lo que podría faltar (13 al 20/11)

Nada muy importante para quien invierte en activos tokenizados desde España:

- **CNMV** (notas de prensa a las 17:17:12 UTC y portada a las 17:17:22 UTC): lo
  último del sector son los avisos del 16/11 y el 18/11, ya incluidos. Nada del
  19 ni del 20/11.
- **ESMA** (RSS y página de noticias, 17:17:31 UTC): solo la nota del 18/11 sobre
  proveedores de datos de mercado, que no es del sector.
- **Banco de España** (actualidad, 17:17:40 UTC): discursos, deuda pública y
  actos; nada que cambie algo para el particular en este sector.
- **Comisión Europea, DG FISMA** (17:17:48 UTC): bienvenida al acuerdo sobre
  transparencia de productos sostenibles (20/11) y actos de educación
  financiera (18/11); fuera del sector.
- **Consejo** (RSS, 17:16:49 UTC): acuerdo sobre transparencia de productos
  sostenibles (19/11); fuera del sector. Nada del régimen piloto DLT.
- **BCE** (RSS, 17:17:55 UTC): informe de estabilidad financiera y discursos;
  la nota del informe no habla de tokenización ni de monedas estables.
- **EBA** (RSS, 17:17:56 UTC): nada del sector.
- **Parlamento Europeo** (RSS, 17:20:47 UTC): nada del paquete de integración
  de mercados ni del régimen piloto.
- **BOE** del 13 al 20/11 (API de datos abiertos, 17:18:11 a 17:18:17 UTC; el
  15/11 no hubo edición): nada sobre criptoactivos, tokenización o registros
  distribuidos.

## Lo que no pude comprobar

- Si el ECOFIN del 09/11 adoptó de verdad la orientación general: la web del
  Consejo (`www.consilium.europa.eu`) responde 403 con «Browser check» (17:16:57
  UTC). No se insiste.
- Referencias del Consejo de Ministros (`lamoncloa.gob.es`): la conexión se
  cortó dos veces (17:22 UTC). Lo cubre en parte el BOE del 13 al 20/11.
- Que no exista ninguna emisión en Bit2Me STX con documento público: solo se
  puede decir «no he hallado».

## Comprobaciones de forma

- `revisarEdicion()` de `rwadar-movil/lib/noticias-sector.js`: sin errores;
  dos avisos de «cifra» en el titular del Consejo (27 y 50 no están tal cual en
  el resumen), el mismo caso que la guía de titulares da como bueno.
- Titulares de 46 a 59 caracteres (límite 60); fechas dentro de los 30 días;
  ninguna en «Hoy», bien, porque no hay nada del sector del 19 ni del 20/11.
- Sin «garantiz…», «oportunidad», promesas, consejos de compra ni nombres de
  personas en ningún texto (castellano e inglés). Cinco fotos distintas.
