# Revisión independiente · IOD, Casa de Outeiro y Spiko · 23/10/2026

**Dictamen:** hay condiciones documentales concretas que pueden actualizarse
con su fecha y alcance. **No hay aprobación de publicación, de SQL ni del
catálogo completo de 49 ofertas.** No se han creado cuentas, enviado órdenes,
probado admisión individual ni comprobado una operación de salida.

La revisión coteja las extracciones primarias guardadas por el investigador,
el registro de descargas de tres PDF y la respuesta pública guardada de Casa
de Outeiro. No es una segunda investigación exhaustiva de los emisores. Se
leyeron las secciones de condiciones, costes, salida y riesgos pertinentes;
no se afirma haber auditado íntegros los 83 folios del prospecto de Spiko ni
los anexos societarios de Casa de Outeiro. **Una extracción de texto no
acredita la validez de una firma digital.**

## Fecha y procedencia

- Fecha de esta revisión: **23/10/2026**.
- El archivo `fuentes-spiko-alius-exa.json` registra consulta de extracción
  el 23/10/2026 a las 18:57:56 UTC. Esa hora no es la fecha de todos sus datos.
- La API guardada de Casa registra consulta el 23/10/2026 a las 19:04 UTC.
- `documentos-hashes.json` registra las descargas de los PDF de IOD y Casa
  el 23/10 a partir de las 19:04:54 UTC; acredita bytes y huella, no el
  contenido legal de anexos que no se haya leído.
- `spiko-web-directa.json` conserva URL, texto y enlaces, pero **no lleva
  fecha/hora de captura dentro del JSON revisado**. La fecha de carpeta no
  basta para fechar una rentabilidad como dato del 23/10.
- Para el conflicto señalado de NAV futuro se abrió una sola fuente externa:
  [Spiko Data EU T-Bills](https://data.spiko.io/eutbl/). La respuesta revisada
  muestra NAV 1,0613 **del 22/10/2026**. No se observó un NAV del 25/10 en esa
  respuesta. Cualquier captura con fecha futura del 25/10 debe excluirse de
  cifras vigentes de este ciclo; no cambiarla silenciosamente a 23/10.

## IOD Occasio · `iod-occasio`

Fuente principal: [extracción del documento 286](../primaria/iod-aktionariat-documentos-exa.md),
primer bloque, líneas 1–188; documento fechado **28/09/2026**. URL primaria:
[ficha fundamental IODO1](https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/169/document/286).

| Afirmación | Veredicto y tratamiento admisible |
|---|---|
| Emisor y activo | **Documentado:** IOD Applications S.L.; obligación no convertible tokenizada para financiar adquisición de derechos de cobro/facturas. No es propiedad directa de cada factura por el tenedor. |
| Apertura/cierre hoy | **No probado por este documento.** Señala suscripción desde 08/10 hasta completar, límite 23/10 y posibilidad de ampliación de hasta un mes. Una fecha límite o una ampliación posible no prueba que siga abierta. Conservar el estado público previo de cierre y no reabrirlo sin una observación actual específica. |
| Mínimo de inversión | **Desconocido.** Los 100 € son precio por token; 100.000 € es mínimo de financiación del proyecto. Ninguno acredita por sí solo el ticket mínimo individual. |
| 12 % anual | **Condición documental del bono**, no rendimiento observado ni garantizado. El dato procede del documento de 28/09, no de una medición del 23/10; no reactivar una cifra de oferta abierta por haber consultado hoy el PDF. |
| Plazo y salida | **Documentado con condición:** vencimiento a 12 meses desde finalizar el desembolso; principal e intereses en pago único posterior al vencimiento; el emisor puede amortizar antes con interés proporcional. Los tokens pueden transmitirse, pero encontrar comprador no está garantizado: el propio documento advierte iliquidez. |
| Costes | **Declaración documental limitada al proyecto:** el documento indica que el inversor no soporta costes por esa inversión. No equivale a ausencia universal de impuestos, gastos de reventa u otros costes ajenos al alcance de esa declaración. |
| Acceso desde España | **No acreditado individualmente.** El domicilio español del emisor y la mención al registro de la plataforma no prueban admisión de residentes españoles bajo las condiciones actuales. Mantener sin comprobar. |
| Seguro hasta 90 % | **No es garantía del capital del inversor.** La cobertura se refiere a facturas/derechos financiados y está sometida a póliza, límites, exclusiones, solvencia de asegurador y posibles retrasos. El propio documento advierte pérdida parcial o total y ausencia de garantía de depósitos. |
| Supervisión | La ficha declara registro de la plataforma en CNMV, pero dice expresamente que **esta oferta no ha sido aprobada ni verificada por CNMV/AEVM**. Esta revisión no ha vuelto a consultar el registro regulatorio. No trasladar el registro de plataforma a una aprobación de la oferta. |

**Actualizable documentalmente:** naturaleza, condición histórica de interés,
vencimiento y forma de amortización, alcance de costes declarados y riesgos.
**No actualizable como hecho actual por esta evidencia:** reapertura, ticket
mínimo individual, acceso español y protección de capital.

## Casa de Outeiro · `casa-de-outeiro`

Fuentes: [documento 263 extraído](../primaria/casa-documentos-registros-spiko-exa.md),
primer bloque, líneas 1–162, y [API pública guardada](../primaria/casa-api-publica-filtrada.json).
Documento fechado **24/06/2026**; el listado de la API registra actualización
del archivo el **13/10/2026**, que no sustituye la fecha interna del documento.
URL primaria: [ficha fundamental](https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/71/document/263).

| Afirmación | Veredicto y tratamiento admisible |
|---|---|
| Emisor y activo | **Documentado:** acciones ordinarias nominativas tokenizadas de Casa de Outeiro Bodega y Viñedos S.A. El documento describe sociedad en constitución; no tratarla como sociedad ya constituida por inferencia. Su actividad y activos subyacentes no convierten cada token en titularidad directa del inmueble. |
| Estado de campaña | **Observación pública acotada del 23/10:** API con `campaignStatus=CAMPAIGN`, campaña activa y fecha final 31/10/2026, coincidente con la ficha. Admite indicar campaña presentada como activa y fecha anunciada; no acredita que cualquier persona pueda contratar ni que la inversión se haya ejecutado. |
| Mínimo individual | **Documentado de forma explícita:** 80 acciones, **2.000 €**. El precio es 25 €/acción y el umbral global de financiación es 2.000.000 €; no confundir esos tres importes. |
| Acceso desde España | **No acreditado por las secciones revisadas.** Activo y emisor españoles no sustituyen condiciones geográficas y KYC. Mantener sin comprobar, salvo otra fuente específica revisada. |
| Recuperar el dinero | **No hay devolución a plazo fijo acreditada.** Se trata de capital; transmisión sujeta a estatutos, pacto de socios, restricciones y contraparte. No describirlo como bono ni prometer venta diaria. |
| Calendario de transmisibilidad | **Conflicto interno del texto.** El mismo apartado alude a limitación hasta 2027 y a compromiso de no transmitir hasta 2026; luego describe liberación de 10 % en tramos de 2,5 % anual de 2027 a 2030 y un plan posterior a 2031. Conservar la advertencia de restricciones; no simplificar a «libre desde 2027» ni resolver la inconsistencia sin leer el pacto/anexo aplicable. |
| Costes | **Declaración documental del proceso:** no costes al inversor en este proyecto de financiación participativa. No extenderla a transmisión, membresía voluntaria, impuestos o intermediarios sin sus documentos. |
| Riesgo y valoración | Hay riesgo empresarial, de ejecución/financiación e iliquidez y posible pérdida total. Las valoraciones y proyecciones del promotor no son tasaciones de salida ni rentabilidades futuras acreditadas. No deducir un rendimiento del precio del token. |
| Supervisión | Registro declarado de la plataforma no significa aprobación de esta oferta. La ficha advierte que CNMV/AEVM no la han aprobado ni verificado. |

**Actualizable:** ticket individual de 2.000 € con documento y fecha, forma
de participación, estado observado de campaña y límite anunciado, advertencia
de transmisión restringida y costes declarados con su alcance.
**Pendiente:** resolver calendario de salida con pacto/anexo, admisión española
y gastos de operaciones no cubiertas. El hash del anexo 264 demuestra que se
descargó; **no equivale a que esta revisión haya leído y cerrado su contenido**.

## Spiko EU T-Bills · `spiko-letras-del-tesoro-euro`

Fuentes: [KID y prospecto extraídos](../primaria/spiko-pdfs-exa.md),
[web directa guardada](../primaria/spiko-web-directa.json) y
[Spiko Data, restricciones y términos guardados](../primaria/fuentes-spiko-alius-exa.json).
Se revisaron el KID completo extraído (primeras 130 líneas) y las secciones
pertinentes del compartimento **EU**, no las tarifas de US/UK u otros productos.
KID y prospecto llevan fecha interna **01/09/2026**; el nombre del archivo
KID incluye 16/10, pero no convierte su contenido en un KID del 16/10.

| Afirmación | Veredicto y tratamiento admisible |
|---|---|
| Identidad del producto | **Consistente:** fondo monetario UCITS francés, clase EUR, ISIN **FR001400ODL1**. Separar sociedad gestora Twenty First Capital, comercializador Spiko Finance y depositario CACEIS. |
| Mínimo en euros | **Documentado y coincidente:** suscripción inicial y posterior de **1 €** en el prospecto de la clase, y mínimo inicial de 1 € en Spiko Data/web. No es una conversión ni una deducción a partir de un token. |
| España | La página de restricciones afirma admitir países salvo una lista exhaustiva, en la que España no figura. Los términos exigen cuenta validada y KYC/AML, cuya aceptación decide Spiko; el prospecto excluye US Persons. **Acredita el alcance geográfico general del proveedor, no admisión garantizada ni comprobación de una cuenta española.** Redacción segura: España no figura excluida en la política consultada, sujeto a validación y restricciones aplicables. No marcar disponibilidad incondicional. |
| Salida | **Documentada con límites:** reembolso a NAV, órdenes centralizadas hasta las 11:30 de París; las posteriores pasan al siguiente día hábil, con excepciones de festivos/cierre de mercado y posible recálculo por eventos excepcionales. No prometer cobro instantáneo ni importe fijo de salida. |
| Límites de liquidez | **Documentados:** gates cuando los reembolsos netos alcanzan el 10 % del patrimonio; pueden ejecutarse parcialmente y diferirse. El prospecto señala hasta 20 NAV en tres meses y duración máxima de un mes. No llamar a esto liquidez garantizada. |
| Costes: 0,25 % | KID y web publican **0,25 % anual** para gestión/otros costes realizados. El KID usa costes del último año. No convertirlo en «coste total máximo» ni interpretar el ejemplo redondeado de 0 € en una semana como coste anual cero. |
| Costes: tarifa de prospecto | En el apartado EU, el cuadro del prospecto recoge **0,30 % de gestión** y **0,10 % máximo de funcionamiento/servicios**. Diferenciar tarifa del prospecto frente al dato de costes realizados del KID; la revisión no acredita cuál será el coste efectivo futuro. No ocultar esta diferencia ni sumar tasas sin identificar su naturaleza y posible alcance máximo. |
| Otros costes | El fondo no establece comisiones de suscripción/reembolso en el cuadro revisado, pero el prospecto contempla costes DLT a cargo del inversor y, bajo una incidencia específica de recuperación de wallet, hasta **500 € sin impuestos** por gestiones técnicas. El KID advierte posibles costes adicionales de distribuidor/asesor. |
| Rentabilidad | **No mezclar ventanas:** la web guardada muestra **2,39 % neto anualizado sobre 31 días**; Spiko Data guardado y la consulta independiente muestran **2,35 % anualizado a 30 días**. La diferencia no prueba por sí sola un error: ventana, extracción y caché difieren. No presentarlos como una misma medida ni como retorno futuro. La fecha del NAV no fecha automáticamente cada rentabilidad. |
| Fecha NAV futura | La fuente externa abierta muestra NAV de **22/10**. **No aprobar ningún dato fechado 25/10 para el ciclo del 23/10.** Si existe otra captura futura, conservarla como discrepancia y excluir esa cifra vigente hasta aclararla. |
| Riesgos | El KID contempla pérdida parcial o total, riesgos de mercado, DLT y wallet; capital no garantizado. Su indicador 1/7 pertenece al documento, con horizonte recomendado de una semana y riesgos adicionales: no equivale a seguridad absoluta ni a una nota propia de RWAdar. |
| Supervisión | El KID identifica autorización AMF del fondo y regulación de la gestora. Esta revisión documental no es una consulta independiente del registro AMF/ACPR ni aprobación para cada inversor. |

**Actualizable:** mínimo 1 €, estructura y clase exactas, condiciones de
reembolso y gates, costes desglosados con naturaleza/fecha, alcance de la
política geográfica y advertencias de riesgo. **No aprobar como cifra actual
única:** rentabilidad sin ventana/fecha trazable, NAV futuro, coste total
incondicional del 0,25 % ni admisión española garantizada.

## Dudas concretas antes de generar o aprobar un lote

1. **IOD:** ¿qué respuesta actual de campaña acredita cierre o reapertura?
   El PDF con límite prorrogable no basta para cambiar el estado anterior.
2. **Casa:** ¿qué cláusula vigente de pacto/anexo resuelve 2026 frente a 2027
   y el calendario de liberación? Hasta entonces publicar solo la restricción,
   con el conflicto descrito, y no una fecha de liquidez asegurada.
3. **Spiko:** ¿qué captura originó la fecha 25/10 y a qué dato concreto se
   asignaba? La fuente independiente revisada muestra NAV 22/10. Identificar
   y fechar por separado rendimiento 30 días, rendimiento 31 días y NAV.
4. **Spiko costes:** el modelo editorial debe permitir distinguir realizado
   KID, tarifa de prospecto y extras. Una única casilla de 0,25 % no basta
   para acreditar el coste total de todos los canales.
5. **Acceso:** no convertir localización del emisor, idioma del sitio,
   aprobación del fondo ni ausencia en una lista de países en admisión
   individual garantizada.

No existe todavía una matriz final de las 49 aprobada por esta revisión.
Los otros 46 expedientes y cualquier SQL posterior necesitan su propia
comprobación; no extrapolar estos tres casos a un cierre global.

## Huellas de las extracciones efectivamente cotejadas

Huellas SHA-256 tomadas al revisar; identifican estos archivos de evidencia,
no certifican el contenido legal ni reemplazan los PDF originales:

| Archivo bajo `../primaria/` | SHA-256 |
|---|---|
| `iod-aktionariat-documentos-exa.md` | `5f53601d33afc3205ba1ac779d4c225ac27fdee9729845994ec6e72a72824ee5` |
| `casa-documentos-registros-spiko-exa.md` | `995a4b3989473f075cff57afaad3a53c2249f9053f12ed70bc64aca2f632328f` |
| `casa-api-publica-filtrada.json` | `8a91012133c668253e0bcece0e0b2634ebeb6e613a5860c21e5b661362fcb509` |
| `spiko-pdfs-exa.md` | `f2e9a4eacbbd7a4e79e9cf95cc2ea628f3f47fbdc39083ef1689d641fea6c6e7` |
| `fuentes-spiko-alius-exa.json` | `cbeb602d7f993259471b03fff7a7223ef9bab7390973d29190f600937768a92c` |
| `spiko-web-directa.json` | `efb32c2c717fa5238b0e8e6ad63c6d76da0627404345227dc9d32fbe1486cd2f` |
