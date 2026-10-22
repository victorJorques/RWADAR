# Condiciones de las ofertas: inventario y contraste primario del 22/10/2026

**Dossier interno, sin aplicación a datos ni publicación.** Se inventariaron las
49 fichas del corte local del 22/10 y se contrastaron documentos primarios de
Spiko, Alius/Casa de Outeiro y Brickwise/BILLA. Esto no acredita una lectura
jurídica independiente de las otras 46 fichas ni una prueba de contratación.
No se inició sesión, no se enviaron formularios y no se aceptaron contratos.

La búsqueda usó Exa en 13 consultas, con 68 entradas solicitadas en total,
incluidos duplicados y consultas sin resultados. Ese número no es un conteo de
fuentes distintas verificadas. Se leyeron después fuentes oficiales completas,
PDF y registros directos; las páginas dinámicas de Alius y CNMV también se
abrieron en navegador. Los PDF relevantes se descargaron y se comprobó
visualmente la disposición de las tablas y restricciones citadas.

## Cobertura real de las 49 fichas

El inventario reproducible está en
`rwadar-entrega-integral-20261022/investigacion-ofertas/`: `inventariar.cjs`,
`cobertura-49.json` y `cobertura-49.md`, con una fila por slug, proveedor,
colección, estado, referencias y los cuatro campos presentados por el helper.
Son archivos internos ignorados, ajenos a las rutas de publicación.

| Medida del corte local | Resultado | Qué significa |
|---|---:|---|
| Fichas / cifras consideradas vigentes por el helper | 49 / 8 | El resto conserva su presentación documental |
| Mínimo numérico en EUR con fuente presentada | **1** | Spiko, 1 EUR |
| Campo mínimo con enlace de fuente, aun sin EUR numérico | 2 | El segundo es Prosegur: declara que no está documentado en euros |
| Acceso específico desde España con fuente y booleano coherente | **0** | Ninguna referencia actual reúne esa evidencia tipada |
| Salida específica presentada con fuente | **1** | Prosegur; no se revalidó su contrato en este dossier |
| Avisos genéricos de reventa con fuente | 16 | No son 16 promesas contractuales de liquidez |
| Costes presentados con fuente | **3** | mF-ONE, mGLO y Spiko; la presentación no contiene necesariamente todos los costes |
| Etiquetas que coinciden con mínimo / España / salida / costes | 4 / 0 / 12 / 5 | Solo detección local, no verificación semántica ni jurídica |

Los huecos tienen causas distintas: falta de referencias, unidades que no son
euros y estados que impiden mostrar condiciones vigentes. Por ejemplo, BILLA
y Casa de Outeiro ya contienen mínimos documentales, pero el helper conserva
el bloqueo porque no están marcadas como actuales. No se corrige ese bloqueo
renombrando etiquetas para forzar una cifra.

El inventario anterior a la corrección del helper observó una sola referencia
de costes: en mF-ONE y mGLO se presentaba éxito del 0%, aunque había referencias
adicionales de gestión. Esa línea **no significaba coste total cero**. Después
se corrigió la presentación y se probó por separado: ahora ambos conceptos se
muestran con sus fuentes y consultas propias, sin sumarlos ni atribuir fuentes
distintas a un solo enlace. Esta corrección de interfaz no equivale a revalidar
contractualmente todos los costes del producto; este dossier no modifica datos.

## Spiko: EU T-Bills EUR, ISIN FR001400ODL1

Se distinguieron la participación del fondo, su gestora Twenty First Capital,
el depositario CACEIS Bank y el distribuidor/centralizador Spiko Finance. El
producto se identificó por ISIN, sin extrapolar condiciones desde otro
compartimento o una clase en dólares.

| Campo | Dato y localizador primario | Fecha del dato / consulta | Alcance y límite |
|---|---|---|---|
| Mínimo EUR | **1 EUR**, tabla de la clase EUR, [prospecto p.36](https://www.twentyfirstcapital.com/admin/backend/api/documents/parts/53/2026-09-01__spiko-sicav---prospectus-vfr-20260901.pdf#page=36); corroborado en [Spiko Data](https://data.spiko.io/eutbl/) | Prospecto 01/09/2026; portal sin fecha propia para esta condición / 22/10 | Suscripción inicial y posterior y mínimo de reembolso; no es valor de una participación |
| Salida ordinaria | Centralización **11:30 de París**, traslado al siguiente día hábil después del corte; [KID p.1 y p.3](https://www.twentyfirstcapital.com/admin/backend/api/documents/parts/53/2026-10-16__dic-priips-eutbl-ven---01092026.pdf#page=3) | 01/09/2026 / 22/10 | Distinguir recepción, ejecución y liquidación; días inhábiles y recalculación excepcional de valor liquidativo |
| Límites de salida | Umbral de **10%** para activar limitación extraordinaria de reembolsos; [prospecto pp.35–36](https://www.twentyfirstcapital.com/admin/backend/api/documents/parts/53/2026-09-01__spiko-sicav---prospectus-vfr-20260901.pdf#page=35) | 01/09/2026 / 22/10 | No describir la liquidez como instantánea e incondicional |
| Coste observado | **0,25% anual**, costes efectivos del último año en [KID p.3](https://www.twentyfirstcapital.com/admin/backend/api/documents/parts/53/2026-10-16__dic-priips-eutbl-ven---01092026.pdf#page=3); portal actual muestra 0,25% y suscripción/reembolso 0% | KID 01/09/2026; portal sin fecha contractual propia / 22/10 | No equivale a fijar de forma permanente todos los costes futuros |
| Otras condiciones de coste | Barème **0,30%** de gestión y **0,10% máximo** de otros servicios; gastos DLT y eventual recuperación de wallet, [prospecto p.37](https://www.twentyfirstcapital.com/admin/backend/api/documents/parts/53/2026-09-01__spiko-sicav---prospectus-vfr-20260901.pdf#page=37) | 01/09/2026 / 22/10 | Diferenciar tarifa contractual y dato efectivo histórico; no sumar y publicar 0,40% como coste realmente cobrado sin conciliarlos |
| Retirada instantánea | Servicio sujeto a elegibilidad y límites de cuenta; puede suspenderse; [condiciones §§12.1–12.3](https://support.spiko.io/hc/en-us/articles/45293573063057-Terms-of-Use) | Versión 2.2, cuerpo fechado 30/06/2026; página actualizada 20/10 / 22/10 | Es un mecanismo distinto; el eventual diferencial de valor liquidativo no se devuelve al cliente |
| España: admisión geográfica | La [política geográfica](https://support.spiko.io/hc/en-us/articles/45293337468177-Geographic-Restrictions) admite países salvo una lista donde España no aparece; [condiciones §9.3](https://support.spiko.io/hc/en-us/articles/45293573063057-Terms-of-Use) imponen requisitos de nacionalidad/residencia y validación | Lista sin fecha expresa propia / 22/10 | Apoya admisión geográfica condicionada; no demuestra alta individual ni suscripción aceptada |
| España: fondo | [CNMV: SPIKO SICAV](https://www.cnmv.es/portal/consultas/iic/iicextranjera?lang=en&nif=N0401205J), registro **2380**, alta **30/01/2026**, IIC comunitaria | Registro consultado 22/10 | La ficha de comercializadoras consultada muestra ALDANA CAPITAL; no usar ese registro para atribuir automáticamente otra entidad o canal |

Se leyó además el [registro de pasaportes ACPR/REGAFI para la referencia 751211 y
España](https://www.regafi.fr/api/explore/v2.1/catalog/datasets/prd-banque-passeports-sortants/records?where=id_referentiel%3D751211%20and%20pays%3D%22ESPAGNE%22):
una fila de libre prestación, inicio 08/01/2026, con alcance A1/C3. Esa fila no
debe convertirse en una autorización para cualquier producto o servicio.

**Conflicto de versiones resuelto:** un KID de 2025 que sigue indexado indicaba
10:30 y ausencia de gates. El KID y prospecto de septiembre de 2026 cambian
esas condiciones. No se debe reutilizar el documento antiguo porque aparezca
antes en una búsqueda. El capital no está garantizado; el horizonte recomendado
del KID es una semana.

**Qué puede sostenerse:** mínimo de 1 EUR y explicación de reembolso con corte,
días hábiles y limitaciones. La admisión desde España debe redactarse con sus
condiciones geográficas/KYC. Antes de transformar el resumen de costes en una
afirmación total, conciliar el dato del portal con el barème del prospecto y el
canal de wallet. No se modificó `disponibleEs` ni ninguna referencia.

## Alius: Casa de Outeiro

Exa devolvía casi únicamente el contenedor de la ficha. Se abrió en navegador,
se leyó la campaña y su pestaña Documentos, y se descargó el documento firmado
**Ficha de datos fundamentales de la inversión, v4**, fechado **24/06/2026**,
seis páginas. Está accesible mediante el botón Documento de emisión y la
pestaña Documentos de la [ficha oficial](https://aliuscap.com/projects/casa-de-outeiro).

| Campo | Literal breve o dato y localizador | Fecha del dato / consulta | Alcance y conflicto |
|---|---|---|---|
| Instrumento y mínimo | **80 acciones, 2.000 EUR**; 25 EUR por acción/token, FDF p.4 | 24/06/2026 / 22/10 | Acciones nominativas ordinarias de Casa de Outeiro Bodega y Viñedos S.A.; no confundir ticket con precio del token |
| Campaña | Fecha límite 31/10/2026, FDF pp.1 y 4; navegador mostró campaña y nueve días restantes | FDF 24/06; estado consultado 22/10 | La apertura visible no demuestra contratación efectiva |
| Custodia/registro | Token City European Exchange A.V. como ERIR; entrega a wallets tras inscripción de ERIR de la emisión, FDF p.4 | 24/06/2026 / 22/10 | Describe un procedimiento; no se confirmó su ejecución registral actual |
| Salida | FDF pp.5–6: restricciones estatutarias, contraparte y liberación parcial de acciones desde 2027 | 24/06/2026 / 22/10 | La redacción alterna 2027/2026; no prometer transmisibilidad inmediata ni un día de desbloqueo inequívoco |
| Costes del proyecto | «El inversor no soportará coste alguno en relación con la inversión en este Proyecto de financiación participativa», FDF p.6 | 24/06/2026 / 22/10 | Las [condiciones generales, inversores §6](https://aliuscap.com/general-terms) advierten posibles costes de transferencia/tarjeta; no afirmar cero costes de cualquier canal |
| Reflexión | Cuatro días naturales para no experimentados, FDF p.2 | 24/06/2026 / 22/10 | Es desistimiento previo, no liquidez de las acciones después de invertir |
| España | [Condiciones generales: habilitación del inversor](https://aliuscap.com/general-terms) e [información básica](https://aliuscap.com/basic-information-for-clients/) | Sin fecha de versión visible / 22/10 | Se leyeron edad, capacidad, KYC y clasificación; no apareció una cláusula inequívoca de admisión de residencia española para este producto |

La [CNMV consultada directamente](https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/proveedor?lang=es&nif=B76632793&nreg=11)
mantiene la denominación **ADVENTUREES CAPITAL PFP, SOCIEDAD LIMITADA**, número
11 y dominio aliuscap.com, para el mismo NIF de las condiciones que ahora usan
ALIUS CAPITAL STOS PSFP S.L. Se registra esa diferencia nominal; no se oculta
ni se infiere que la CNMV aprueba Casa de Outeiro.

**Qué falta:** contrastar los anexos/pacto definitivos y resolver la redacción
de transmisibilidad; comprobar la inscripción concreta de la emisión/ERIR y
una fuente explícita de acceso por residencia. El ticket y el coste del proyecto
sí tienen respaldo documental. La ficha pública actual se conserva; este dossier
no convierte por sí solo su estado en actual ni añade una candidata pendiente.

## Brickwise: terreno con arrendamiento BILLA, ISIN AT0000A3SE89

Se siguieron los documentos que declara la [API pública oficial](https://api.app.brickwise.at/api/v2/assets),
comprobando ISIN, emisor Brick Qogir GmbH & Co KG y fecha. El vínculo directo de
condiciones usa el subdominio staging.cdn, pero procede de esa API; se comprobó
el contenido y no se trató como una dirección supuesta.

| Campo | Literal breve o dato y fuente | Fecha del dato / consulta | Alcance |
|---|---|---|---|
| Mínimo EUR | **Mindestzeichnungsbetrag: EUR 1.000,00**, [condiciones p.4](https://staging.cdn.brickwise.at/cc140258-a0a6-4b84-b355-f72c8b32d8cb.pdf#page=4) | 16/02/2026 / 22/10 | Suscripción total mínima; distinto del precio de emisión de 100 EUR por token, p.3 |
| Derechos y riesgo | Derecho de cobro vinculado al activo; [KID pp.1–2](https://storage.googleapis.com/brickwise_templates/assets/AT0000A3SE89/AT0000A3SE89_Basisinformationsblatt.pdf#page=2), riesgo **6/7** | 16/02/2026 / 22/10 | No es propiedad registral directa del terreno ni un depósito garantizado |
| Horizonte | KID p.3: **10 Jahre** recomendados | 16/02/2026 / 22/10 | Horizonte recomendado distinto del primer derecho ordinario de cancelación |
| Cancelación | [Condiciones pp.4 y 12–14](https://staging.cdn.brickwise.at/cc140258-a0a6-4b84-b355-f72c8b32d8cb.pdf#page=12): primer período cinco años, reglas posteriores y oferta de venta previa | 16/02/2026 / 22/10 | No basta resumirlo como devolución garantizada a cinco años; revisar plazo y valoración de liquidación completos |
| Reventa | [Condiciones §13, pp.15–16](https://staging.cdn.brickwise.at/cc140258-a0a6-4b84-b355-f72c8b32d8cb.pdf#page=15), y [funcionamiento del mercado](https://www.brickwise.at/support/wie-funktioniert-der-handel-am-marktplatz) | Condiciones 16/02; soporte sin fecha propia / 22/10 | Requiere contraparte, aceptación, cuenta y requisitos; venta no garantizada |
| Intermediación | **1,50%** al comprador y al vendedor según [costes de Brickwise p.1](https://cdn.brickwise.at/legal/Kosteninformationen_Brickwise.pdf#page=1) | Documento sin fecha visible / 22/10 | No trasladar al producto los promedios de costes externos del folleto general |
| Costes específicos | [KID p.3](https://storage.googleapis.com/brickwise_templates/assets/AT0000A3SE89/AT0000A3SE89_Basisinformationsblatt.pdf#page=3): tablas de reducción de rendimiento por horizonte | 16/02/2026 / 22/10 | Los 1,02%/0,15% son impacto anualizado en la tabla; no son tarifas de compra y venta que sustituyan al 1,50% de intermediación |
| España | [Identificación](https://www.brickwise.at/support/welche-ausweisdokumente-werden-fur-die-identifizierung-akzeptiert) acepta documentos EEE; [alta](https://www.brickwise.at/support/wie-eroffne-ich-einen-account) describe verificación | Sin fecha de versión visible / 22/10 | Aceptar un documento no prueba comercialización ni admisión residencial española del valor |

En la consulta la API identificó el activo como primario, con 6.342 tokens de
emisión disponibles y 100 EUR por unidad. El campo `campaignDate` contenía
`5/.5/.026`, no una fecha utilizable para acreditar la apertura. Se conservan
por separado condición contractual, estado técnico y disponibilidad ejecutable.
La emisión y el KID son específicos de BILLA; no se extrapolan a GreenPoint ni
a los otros valores de Brickwise.

**Qué puede sostenerse:** ticket contractual de 1.000 EUR, explicación completa
de salida, riesgo y costes distinguiendo unidad/base temporal. **Qué falta para
afirmar acceso español y apertura ejecutable:** condiciones geográficas de
distribución/admisión del producto y confirmación documental del período vigente.
No se crea una nueva alta con esos datos esenciales sin acreditar. La referencia
documental ya publicada sigue disponible.

## Integridad de los PDF conservados

Copias y capturas de páginas bajo la carpeta interna ignorada indicada al
principio. Las fechas de los documentos no se reemplazaron por la fecha de
descarga. No incluir estos PDF ni las descargas originales en rutas publicables.

| Copia local | Páginas | SHA-256 |
|---|---:|---|
| spiko-prospecto-20260901.pdf | 84 | `940559b4976a6837791e72725bc4ac3bf4c5faf579592bed7d36ac9d215f74fe` |
| spiko-kid-20260901.pdf | 3 | `378cab2c92563ba6b86b9641631d54a12763347d40a195d33803f2ce4579ba34` |
| alius-outeiro-ficha-v4.pdf | 6 | `f5cf8ed408feef2979e5ea72a68455746994ce5ee39820d2171d7e6420e4fc5e` |
| brickwise-billa-condiciones.pdf | 17 | `56b3147d497082b01b573f51680655540365f95e43a64065ad4e8de8a000b533` |
| brickwise-billa-kid.pdf | 3 | `3f3206fd1c953eef67faeba7ac60c2b4200f4a56c5c7674171ed3d2b250734bf` |
| brickwise-costes.pdf | 2 | `3ddf88826e098f02a2552f3b6d9a6236e406ac57ba2cb37fc7da95a0906b862b` |

## Decisión editorial que permite este dossier

Hay evidencia útil para completar referencias, pero las tablas anteriores
**no están aplicadas ni publicadas**. Cada cambio crítico necesita una segunda
revisión de sus documentos y una nueva decisión concreta. No se deben cambiar
etiquetas o booleanos para ocultar una laguna de investigación. Una candidata
del ciclo diario se admite y publica después de superar las compuertas, o no
se admite ni publica hoy; se conserva el expediente histórico y mañana se
consulta de nuevo, sin cola ni aprobación arrastrada. El catálogo completo
existente se conserva con sus avisos.
