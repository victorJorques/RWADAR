# RWAdar · cómo cobrar a empresas sin confundir publicidad con intermediación

Fecha de investigación: 27 de septiembre de 2026. Documento de decisión y
preparación, no dictamen jurídico ni autorización para facturar o publicar.
Se analiza España/UE como mercado inicial. La ubicación comunicada por el
propietario no acredita por sí sola residencia fiscal, alta, sociedad ni cuenta.
El estado operativo vigente se conserva en `docs/INTERNO.md`.

## 1. Recomendación ejecutiva

**Decisión posterior del usuario: fichas gratuitas y ninguna comisión por
inversiones ahora; publicidad dentro de la app como primer ingreso.** Las
comisiones tipo Booking quedan para una fase futura, sin retroactividad.
Se prepara la vía de red publicitaria, con AdMob como candidato técnico, no
como cuenta elegida, contrato aceptado o ingreso asegurado. La anterior
preferencia por un piloto de publicidad directa no sustituye esta decisión.

| Vía | Qué compraría la empresa | Cómo cobraríamos | Decisión recomendada |
|---|---|---|---|
| Ficha editorial | Nada: inclusión y mantenimiento editorial gratuitos | No se factura | Conservar como base de confianza y adquisición de catálogo |
| Publicidad directa | Espacio publicitario concreto, creatividad aprobada y periodo definido | Contrato/orden de campaña, factura B2B y transferencia | Alternativa opcional, no cobro obligatorio a las empresas contactadas |
| Afiliación por conversión | Operaciones válidas atribuidas según acuerdo | Conciliación, ajustes, factura/autofactura pactada y pago B2B | Objetivo de crecimiento, bloqueado hasta clasificación y contrato por oferta |
| Red de anuncios/AdMob | Inventario servido por terceros | Liquidación de la red a su editor, no factura a cada emisor del catálogo | Preparación prioritaria por decisión del usuario; activación pendiente de cuenta, revisión, privacidad y pruebas |
| Intermediación regulada propia | Servicios de inversión/criptoactivos autorizados | Según licencia, conducta e incentivos aplicables | No improvisarla para cobrar el 3 %; estudiar solo si el negocio justifica su coste y estructura |

La publicidad por campaña no necesita ser una suscripción mensual: puede ser
un piloto acotado y opcional. CPM/CPC son posibles propuestas comerciales, pero
requieren su propia revisión de actividad y medición; **no se presentan como
un atajo automáticamente lícito**. No mezclar el precio de anuncios con el
número de inversores o capital captado.

## 1 bis. Publicidad en la app: recorrido inicial propuesto

**Circuito:** anunciante → red publicitaria → cuenta del titular de RWAdar.
No se pide dinero a las empresas por sus fichas o inversiones. No hace falta
un checkout de inversiones, Stripe Connect ni custodiar capital para recibir
liquidaciones de una red. Si el usuario elige AdMob, el contrato es con la
entidad de Google que figure en su cuenta, no necesariamente una entidad que
podamos inferir por su idioma o ubicación. Se consulta en el primer párrafo
de los términos de la cuenta. [Google, entidad contratante](https://support.google.com/admob/answer/2772511?hl=en).

### Qué paga la red y cuándo

AdMob liquida ingresos publicitarios, no una cantidad garantizada por instalar
un banner. Su ciclo es mensual; distingue estimaciones de ganancias finalizadas
y puede ajustar tráfico inválido. El umbral publicado para cuentas en EUR es
**70 EUR**, condicionado a verificaciones y ausencia de retenciones/bloqueos.
SEPA está disponible para España, con verificación de cuenta mediante un
pequeño ingreso. El banco real todavía no está configurado ni verificado aquí.
[Umbrales](https://support.google.com/admob/answer/2772208),
[pagos y ajustes](https://support.google.com/admob/answer/2772140?hl=en),
[SEPA](https://support.google.com/admob/answer/13782594?hl=en-GB).

No tenemos usuarios activos, impresiones servidas ni eCPM medidos que permitan
prometer rentabilidad. La estimación futura sería impresiones monetizadas / 1000
× eCPM observado, antes de impuestos y costes, y no equivale a efectivo cobrado.
Los acuerdos directos de precio fijo siguen siendo una alternativa separada.

### Pasos y responsables propuestos

| Orden | Acción | Responsable propuesto | Evidencia antes de avanzar |
|---|---|---|---|
| 1 | Confirmar si existe cuenta de red, titular, país y entidad pagadora | Titular | Datos y términos reales en expediente privado; sin aceptar contratos ni crear duplicados por inferencia |
| 2 | Revisar actividad, alta y tratamiento fiscal de las liquidaciones | Titular + gestor | Obligaciones documentadas, cuenta del titular y conciliación; no guardar NIF/IBAN en Git |
| 3 | Preparar un solo espacio de banner separado del catálogo | Desarrollo + producto | Diseño rotulado Publicidad, sin superponer botones ni incentivar clics, sin convertir fichas gratuitas en patrocinadas |
| 4 | Integrar consentimiento y SDK en una build de desarrollo con anuncios de prueba | Desarrollo + privacidad | Rechazo, retirada, error, sin red y segunda apertura probados; ninguna petición publicitaria antes de resolver elegibilidad |
| 5 | Cerrar lanzamiento y publicar la app en una tienda compatible | Titular + desarrollo | Identidad, P0, catálogo, derechos, seguridad, ficha de tienda y declaraciones de datos/ads; autorización de publicación vigente |
| 6 | Verificar app-ads.txt, revisión de red y banco, después activar gradualmente | Titular + operación | Estado de app aprobado, archivo del editor real, primer ingreso conciliado y mecanismo de apagado |

AdMob exige app publicada y vinculada a una tienda compatible para su revisión
de preparación; el servicio completo depende de la aprobación. Las nuevas apps
de Play/App Store necesitan además verificación con **app-ads.txt**. No se
creará ese archivo con un ID inventado ni se cambiarán los dominios de retirada
antes del corte autorizado. [Preparación](https://support.google.com/admob/answer/10564477?hl=en),
[verificación](https://support.google.com/admob/answer/14538460).

La app actual usa Expo 57 y React Native 0.86.2. El candidato
`react-native-google-mobile-ads` necesita código nativo y una nueva build;
**no funciona en Expo Go**. No se ha instalado ni se han configurado App IDs
en este corte. Primero se validará una versión concreta contra estas dependencias.
Una web/PWA no se monetiza simplemente insertando este SDK móvil.
[Documentación del mantenedor](https://docs.page/invertase/react-native-google-mobile-ads).

### Privacidad, anuncios y seguridad

Propuesta prudente: un banner no personalizado, sin interstitials ni anuncios
recompensados inicialmente. Es una recomendación de producto, no un formato ya
aprobado. «No personalizado» **no significa sin identificadores ni sin
consentimiento**. La CMP/UMP debe ser compatible con los requisitos vigentes;
la política interna inicial será no solicitar anuncios si se rechaza, existe
incertidumbre o falla el consentimiento. No activar automáticamente anuncios
limitados como sustituto sin revisar ese tratamiento. Mantener un acceso a
preferencias para retirar el consentimiento. La web actual continúa sin SDK.
[Google, modos](https://developers.google.com/admob/android/privacy/ad-serving-modes),
[CMP](https://support.google.com/admob/answer/13554116),
[mensajes y retirada](https://support.google.com/admob/answer/10114014?hl=en).

Configurar categorías y revisión de creatividades para reducir anuncios
engañosos o inadecuados; un filtro no garantiza que nunca aparezcan. No transmitir
selecciones de inversión, wallets, identidad de inversores ni datos financieros
a la red. Revalidar privacidad y declaraciones de tienda antes de introducir
terceros. Usar únicamente anuncios de prueba durante desarrollo: Google prohíbe
clicar anuncios propios o inflar visitas/impresiones. No monetizar sitios ajenos
incrustados sin permiso. [Políticas AdMob](https://support.google.com/admob/answer/2753860).

MFA, permisos mínimos, recuperación de cuenta protegida, comprobación de cambios
de banco por canal independiente y conciliación mensual son controles propuestos,
no garantías contra robo. Guardar credenciales y documentación bancaria fuera del
código. El gestor debe comprobar la contraparte: si fuera Google Ireland y el
servicio B2B estuviera sujeto a la regla aplicable, revisar inversión del sujeto
pasivo, ROI/VIES y 349; no aplicar el 21 % automáticamente ni llamar exento al
ingreso. La documentación de la red no sustituye la fiscalidad del titular.
[Google Ireland](https://support.google.com/admob/answer/4382717?hl=en),
[AEAT, servicios internacionales](https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-comercio-exterior/prestaciones-servicios.html).

**Estado:** preparación local; sin alta de cuenta, aceptación de términos, SDK,
publicación en tienda, anuncios reales ni cobros. El catálogo gratuito no necesita
un contrato de comisión. La revisión financiera de las fichas y el cierre de
seguridad siguen siendo necesarios aunque el ingreso venga de anuncios.

Para este ajuste se usó Exa en tres frentes (pagos, privacidad e integración):
20 resultados solicitados en cuatro búsquedas, más lectura directa de cuatro
páginas de Google; incluyen duplicados y no son 20 fuentes independientes.
Se priorizaron documentos de Google y del mantenedor, descartando tutoriales
deprecados. No se inspeccionó ninguna cuenta publicitaria privada.

## 2. El punto jurídico que decide la comisión

### Instrumentos financieros: no basta con enviar al proveedor

La comercialización y captación profesional están reservadas. La figura de
agente exige entidad principal, responsabilidad de esta e inscripción antes
de actuar. No basta que la empresa que paga tenga una licencia: debe cubrirse
también la función concreta de RWAdar. [Ley 6/2023, arts. 129–130](https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053).

La CNMV distingue publicidad limitada a difundir contenidos de captación. El
pago por clientes o volumen es un indicio de esta última; incluso una cuota
fija puede no bastar si se interviene para crear relaciones de clientela.
La FAQ admite publicidad fija con una pequeña prima de éxito, pero no da un
umbral que legitime convertir una comisión íntegra del 3 % en esa excepción.
[CNMV, FAQ MiFID II, 22.2, versión 18/06/2026](https://www.cnmv.es/docportal/Legislacion/FAQ/FAQ_MiFIDII.pdf).

**Consecuencia para RWAdar:** si el recorrido es captación reservada, hay que
cambiar la actividad o formalizar una estructura autorizada; ni un aviso
«no asesoramos», ni no custodiar dinero, ni cambiar la base del porcentaje lo
solucionan por sí solos.

La vía de agente no es un registro genérico para afiliarse libremente a todos:
el RD 813/2023 contempla exclusividad para una entidad o varias del mismo
grupo, controles e idoneidad. Esto puede chocar con un comparador
multiplataforma y debe valorarse antes de elegirla. [RD 813/2023, arts. 14–17](https://www.boe.es/eli/es/rd/2023/11/08/813/con).

Tampoco es exacto afirmar que un agente nunca puede cobrar solo variable: la
FAQ 5.3 actualizada en junio de 2026 admite ese diseño bajo criterios
cualitativos, neutralidad y gestión de conflictos. Esa posibilidad se refiere
a agentes debidamente encuadrados, no a un publisher no autorizado. [CNMV, FAQ 5.3](https://www.cnmv.es/docportal/Legislacion/FAQ/FAQ_MiFIDII.pdf).

### Financiación participativa ECSP/PSFP

El artículo 3.3 prohíbe al proveedor remunerar el enrutamiento de órdenes de
inversores a ofertas concretas. No es una prohibición indiscriminada de toda
publicidad ni de todo pago a terceros. La conclusión depende del flujo real;
RWAdar no habilitará este supuesto dentro de un programa universal de
comisiones. [Reglamento (UE) 2020/1503, art. 3.3](https://eur-lex.europa.eu/eli/reg/2020/1503/oj).

### Criptoactivos MiCA

Primero se clasifica el derecho: los instrumentos financieros están excluidos
del ámbito de MiCA, no de regulación. MiCA incluye como servicio la colocación
por cuenta del oferente; el análisis no termina al comprobar que RWAdar no
recibe órdenes ni dinero. Hay que revisar la actividad propia frente a los
arts. 3, 59 y 79, y las restricciones del art. 80.2 si hubiera enrutamiento de
órdenes. Las comunicaciones tienen requisitos según token y servicio
(arts. 7, 29, 53 y 66). Un CASP autorizado no presta automáticamente su licencia
al afiliado. [MiCA, texto oficial](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114).

### Otros derechos y servicios B2B

Una suscripción a software de tokenización o un servicio profesional puede
permitir un acuerdo comercial distinto de captar inversión minorista.
Es una línea separada, no una manera de rebautizar una inversión. Oro digital,
fracciones de inmuebles o acciones suizas no se clasifican por el nombre de
la marca: se necesitan términos, entidad, derecho adquirido y territorio.

## 3. Cómo vender anuncios de forma defendible

La Ley General de Publicidad contempla la difusión de anuncios en espacios o
tiempos pactados y exige distinguirlos de la información. También regula
incumplimientos de entrega. Vender un banner identificado es distinto de
vender una recomendación editorial. [Ley 34/1988, arts. 9 y 17–19](https://www.boe.es/buscar/act.php?id=BOE-A-1988-26156).

Para el primer piloto propongo:

1. Un módulo separado del listado orgánico, marcado **Publicidad**, con
   anunciante y destino reconocibles; nunca una nota o supuesto sello de calidad.
2. Creatividad alojada por RWAdar y seleccionada por sección, sin perfiles,
   cookies publicitarias, identificadores persistentes ni SDK de terceros.
3. Contrato por espacio y fechas, con inicio condicionado al lanzamiento
   efectivo. No vender una audiencia actual que aún no está acreditada.
4. Entrega verificable con ubicaciones, fechas y capturas; medir impresiones
   solo después de definir método, filtrado de robots y protección de datos.
5. Suspensión inmediata por caducidad, falsedad, derechos insuficientes,
   producto no elegible o cambio de régimen; ajustes del servicio no entregado.

Si el anuncio promociona inversiones, sigue siendo publicidad financiera.
La Circular 2/2020 alcanza también determinados terceros que hacen publicidad
por iniciativa propia. Deben revisarse beneficios y riesgos, legibilidad,
comparaciones y vigencia; una tarjeta compacta no puede esconder advertencias
esenciales. La aprobación de la creatividad por el anunciante no exonera por
sí sola a RWAdar. [Circular 2/2020, norma 4.i, norma 5 y anexo](https://www.boe.es/buscar/doc.php?id=BOE-A-2020-14107).

**Elección empresarial:** empezar con anunciantes relevantes de servicios no
financieros —por ejemplo, software o servicios B2B— reduce preguntas de
distribución de inversiones, aunque conserva obligaciones de publicidad,
contrato y privacidad. No hay anunciantes ni precios aceptados acreditados.

La alternativa directa tiene menor dependencia de SDK; si se sigue la vía de
red elegida para preparar, los anuncios no personalizados pueden seguir usando
identificadores y exigir consentimiento. En iOS, el rastreo entre empresas
puede requerir ATT. Una CMP no sustituye verificar el tráfico real del SDK.
[Google: modos de anuncios](https://developers.google.com/admob/android/privacy/ad-serving-modes),
[Apple: privacidad y uso de datos](https://developer.apple.com/app-store/user-privacy-and-data-use/).

«Contextual» no significa ausencia de datos: IP, logs y contadores también
deben revisarse. [AEPD, guía de cookies](https://www.aepd.es/guias/guia-cookies.pdf).

## 4. Qué programas reales hemos encontrado

Estas páginas prueban lo que anuncian los proveedores, no la legalidad de
RWAdar, la seguridad de sus activos ni la aceptación de nuestra candidatura.

| Empresa | Evidencia pública comprobada | Falta antes de cobrar | Prioridad |
|---|---|---|---|
| Reental | Programa profesional que admite comparadores/personas/entidades, usa Impact y anuncia ventana de atribución de 90 días; tarifa y liquidación en panel | Contraparte, contrato vigente, tasa/base, ofertas y países admitidos, aprobación de RWAdar, roles de datos, factura y reversos | Primera solicitud de documentación a preparar; no alta automática |
| RealT | Página que anuncia 2 %; PDF de acuerdo de 2023 con requisitos no-US y tenencia de token | Confirmar vigencia y pagador —LLC en PDF frente a Inc. en página—, elegibilidad, compras válidas, factura y régimen español/UE | Segunda prioridad; no comprar tokens para habilitar el programa |
| Lofty AI | Programa de referidos de usuario, con premios/crédito y condiciones | No se ha acreditado un contrato publisher B2B, derecho a facturar ni elegibilidad territorial | No tratar premios de consumidor como ingresos empresariales contratados |
| Prosegur Digital Gold | Producto oficial; no se encontró programa profesional público en las búsquedas dirigidas | Acuerdo individual, pagador, clasificación, países y licencia de materiales; aclarar alcance de aviso legal | Posible conversación sobre publicidad/colaboración, no socio confirmado |

Fuentes de cada fila: [Reental profesional](https://www.reental.co/en/affiliate),
[RealT programa](https://realt.co/affiliate-program/),
[RealT contrato publicado de 2023](https://realt.co/wp-content/uploads/2023/01/RealT-Affiliate-Terms-and-Conditions-1.23.23b.pdf),
[Lofty AI referidos](https://www.lofty.ai/refer) y [términos](https://www.lofty.ai/terms),
[Prosegur Digital Gold](https://prosegurdigitalgold.com) y [aviso legal](https://es.prosegurdigitalgold.com/legal).

El programa [Reental Builders](https://www.reental.co/en/referidos), con premio
en RNT, es diferente del profesional. No sumar premios en tokens como si fueran
facturas cobradas en euros. Lofty.com es un CRM homónimo, no Lofty.ai.

El aviso enlazado por Prosegur menciona otro dominio de su grupo y exige
autorización para ciertos usos. Se debe aclarar su alcance; no afirmamos que
una cláusula unilateral convierta automáticamente cualquier enlace en ilícito.

## 5. El contrato que crea el derecho a cobrar

**Mostrar una oferta no genera una deuda a favor de RWAdar.** No hay cobro
unilateral ni retroactivo por fichas que se ofrecieron gratis. El servicio y
su remuneración necesitan aceptación; un acuerdo escrito reduce la disputa
sobre qué se contrató. [Código Civil, arts. 1254, 1258 y 1261–1262](https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#art1254).

Hay que identificar al obligado a pagar: emisor/SPV del activo, operador de
plataforma o agencia no son intercambiables. Que el operador facilite el enlace
no obliga al emisor, ni viceversa. El firmante debe tener capacidad.

Dos órdenes/anexos independientes, aunque compartan contrato marco:

| Publicidad | Conversión permitida |
|---|---|
| Espacio, creatividad, URL, fechas, territorio y precio | Oferta y pagador concretos, evento, base y porcentaje |
| Criterio de entrega y prueba | Ventana, regla de atribución y prueba conciliable |
| Corrección, repetición o abono por incumplimiento | Duplicados, fraude, desistimientos, impagos y devoluciones |
| Sin promesa de inversiones ni recomendación | Sin promesa de beneficio para proveedor o inversor |

En ambos: impuestos, factura/autofactura cuando sea válida, moneda, vencimiento,
responsables, reclamaciones, suspensión, terminación, materiales, protección
de datos y conservación de evidencia. Contrato y factura describen el servicio
real: no llamar «publicidad» a un servicio reservado para evitar su régimen.

Para logos, fotos, textos y extracción de catálogo pedir licencia/feed/API con
alcance web+móvil, actualizaciones y retirada. La referencia leal a una marca
no autoriza copiar imágenes o bases de datos ni aparentar asociación.
[Ley de Marcas, art. 37](https://www.boe.es/eli/es/l/2001/12/07/17/con#art37),
[LPI, arts. 17–18 y 133](https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930).

## 6. El 3 % necesita denominador y economía real

El porcentaje es una propuesta inicial del usuario. **No se ha confirmado la
base.** Ejemplo puramente aritmético de una inversión de 10.000 EUR con 100 EUR
de ingreso propio del proveedor:

| Base hipotética | Comisión RWAdar al 3 % |
|---|---:|
| Capital invertido: 10.000 EUR | 300 EUR |
| Ingreso del proveedor: 100 EUR | 3 EUR |

No son el mismo modelo: el primero sería tres veces el ingreso del proveedor
en este ejemplo. No son márgenes reales observados ni una recomendación de
inversión. Antes de fijar precio hay que conocer margen, recurrencia, coste de
servicio, anulaciones y disposición a pagar. El 3 % no es necesariamente bajo.

La promesa comercial precisa sería: **sin conversión válida atribuida, no hay
comisión**. Una inversión no acredita beneficio del emisor ni del inversor.
No habrá incrementos automáticos o retroactivos por alcanzar liderazgo; una
renegociación requiere acuerdo y efectos futuros.

Para anuncios, el precio debe reflejar un servicio/audiencia demostrable. No
hay base para proclamar que 490 EUR mensuales o cualquier otro precio anterior
estén validados. Puede probarse un único piloto acotado; no prometer tráfico
ni construir una previsión de caja con clientes que aún no han aceptado.

## 7. Cómo llega el dinero, paso a paso

**Conversión, cuando esté autorizada:**

1. Contrato y oferta aprobados antes de activar enlaces o medición.
2. El usuario sale al proveedor, que gestiona elegibilidad, KYC, contratación,
   pago, custodia y soporte. RWAdar no recibe el capital.
3. El proveedor confirma únicamente las conversiones pactadas tras los ajustes
   aplicables. El clic o registro no es venta.
4. Se concilian base, moneda y anulaciones. Si no hay mecanismo verificable
   para discutir discrepancias, no hay un modelo cobrable fiable.
5. RWAdar emite factura o usa autofacturación acordada y fiscalmente válida.
6. La empresa paga desde su tesorería a una cuenta del mismo titular que
   factura; se concilian banco y contabilidad. No se reparte un checkout del inversor.

**Publicidad:** contrato/orden de campaña → entrega según condiciones → factura
y cobro en el calendario pactado. Un anticipo es posible solo si se acuerda y
se trata fiscalmente; no equivale a autorizar publicar ni a poder garantizar
una fecha no cerrada. Dejar regulado el abono si no se presta el servicio.

Para el primer cliente recomiendo transferencia B2B y software de facturación
adecuado. No hace falta construir una pasarela dentro de la app. Una futura
pasarela requiere aceptación de la actividad por el proveedor, conciliación,
devoluciones e integración segura.

Controles propuestos: MFA, acceso mínimo, cuenta dedicada o separable, doble
revisión de altas/cambios de beneficiario, confirmación de IBAN por canal
independiente, conciliación periódica y reserva fiscal. No guardar IBAN completo,
credenciales, KYC o tarjetas en Git. Un pago/webhook nunca cambia la clasificación
editorial ni publica por sí solo. Son controles, no una garantía contra robo.

La atribución aleatoria puede seguir siendo dato personal. Minimizar reportes,
no recibir nombres/listas de inversores, wallets ni órdenes; fijar roles, base,
retención y consentimiento según la implementación. [AEPD, obligaciones en apps](https://www.aepd.es/guias/nota-tecnica-apps-moviles.pdf).

## 8. Fiscalidad: preparar antes de la primera factura

Si el prestador está establecido en España, confirmar con gestor alta censal
036, actividad, obligaciones contables y Seguridad Social cuando procedan.
El 037 está suprimido; no usar guías antiguas. Elegir autónomo o sociedad según
hechos/riesgo: una SL no elimina responsabilidades propias ni autoriza servicios
financieros. [AEAT, 036](https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/informacion-sobre-presentacion-modelos-no-periodicos/modelo-036.html).

El propietario ha precisado en el chat coordinado que llevará RWAdar como
**persona física**. Esa es la titularidad prevista; no acredita alta ni elimina
la necesidad de identificar al prestador. El contrato, la factura y la cuenta
receptora deben corresponder a esa persona, aunque RWAdar sea la marca.
No publicar datos personales incompletos ni inventar una sociedad.

Reglas de partida, no liquidación fiscal del titular:

| Servicio publicitario B2B ordinario | Tratamiento inicial a confirmar |
|---|---|
| Receptor empresarial en península/Baleares | Generalmente 21 % de IVA |
| Receptor empresarial en otro Estado UE | Regla general de localización en destino; revisar inversión del sujeto pasivo, NIF-IVA/ROI/VIES y 349 |
| Receptor empresarial fuera de UE | Regla general fuera de IVA español; comprobar excepciones, establecimiento receptor y obligaciones en destino |

No presumir exención financiera porque la factura diga «comisión»: importa la
prestación efectiva. Diferenciar no sujeción por localización de exención, y
recordar que Canarias, Ceuta y Melilla no son territorio IVA peninsular.
[Ley IVA, arts. 20, 69–70 y 90](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740),
[AEAT, servicios internacionales](https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-comercio-exterior/prestaciones-servicios.html),
[AEAT, ROI/VIES](https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-comercio-exterior/identificacion-realizar-operaciones-otros-empresarios-ue.html).

Como persona física hay que clasificar además la actividad empresarial o
profesional y revisar IRPF, pagos fraccionados y posibles retenciones. Para
rendimientos profesionales sujetos a retención, el tipo general es 15 % y
el 7 % inicial exige cumplir sus condiciones; **no toda factura de un autónomo
lleva retención ni toda actividad puede aplicar el 7 %**. El gestor debe cerrar
actividad, epígrafe y obligaciones con los hechos reales.
[AEAT, retenciones](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/folleto-actividades-economicas/7-otras-obligaciones-fiscales-retenciones.html).

Ejemplo de factura publicitaria doméstica, no tarifa propuesta: 500 EUR de base
+ 105 EUR de IVA = 605 EUR antes de cualquier retención que corresponda.
Los 105 EUR no son margen disponible. Factura con
identificación, concepto real, fechas, numeración y tratamiento fiscal correctos.

No confundir SIF/VeriFactu con factura electrónica B2B. La información AEAT
consultada sitúa la adaptación SIF en 1/1/2027 (IS) y 1/7/2027 (resto incluidos).
Para factura B2B, el RD 238/2026 prevé aplicación vinculada a una orden
ministerial: **no se ha verificado aquí una orden posterior que permita fijar
la fecha concreta de RWAdar**. Confirmar ámbito y calendario antes de contratar
software; un PDF por correo no garantiza cubrir obligaciones futuras.
[AEAT, SIF](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/folleto-actividades-economicas/5-impuesto-sobre-valor-anadido/5_12-veri-factu.html),
[AEAT, factura B2B](https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/marzo/31/facturacion-electronica-obligatoria.html).

## 9. Plan de fase futura: comisiones y acuerdos directos

Este cuadro no es la secuencia del ingreso inicial ni un bloqueo de la beta
gratuita. Para publicidad en app prevalece el apartado 1 bis.

| Orden | Acción | Responsable propuesto | Evidencia necesaria |
|---|---|---|---|
| 1 | Confirmar quién contrata/factura, alta y cuenta; elegir base del 3 % | Propietario + gestor | Datos en expediente privado, sin secretos en repositorio |
| 2 | Encargar revisión de un flujo concreto, no de una idea genérica | Propietario + abogado financiero | Conclusión escrita sobre oferta, país, papel de RWAdar, remuneración y publicidad |
| 3 | Obtener términos completos del programa profesional Reental y/o de una empresa interesada | Responsable comercial | Contrato/propuesta real, pagador, países, tasas y evidencia de conversión |
| 4 | Preparar piloto publicitario contextual separado | Producto + comercial + revisor | Creatividad, espacio, precio propuesto, entrega y autorización del anunciante |
| 5 | Validar factura, conciliación, cancelación y retirada en pruebas | Operación + gestor + desarrollo | Casos sintéticos completos; ninguna prueba usa capital real |
| 6 | Cerrar P0 de seguridad, catálogo vigente y pruebas de lanzamiento | Seguridad + producto | Evidencia actual y segundo revisor; despliegue solo al final |

No se contrata asesor, banco, pasarela, red publicitaria o programa de afiliados
ni se envían propuestas desde esta investigación. Tampoco se replica una ronda
de contactos hecha desde otro chat: antes de contactar, consultar el registro
comercial existente y obtener la autorización correspondiente. Los correos
comerciales también deben cumplir sus reglas; que una dirección sea pública no
equivale a consentimiento publicitario. [LSSI, art. 21](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758).

**Criterio para poder cobrar:** prestación lícita + contrato aceptado + evidencia
de entrega/conversión + titular/alta/fiscalidad + cuenta y conciliación. Publicar
el sitio o abrir Stripe no sustituye ninguna de esas piezas.

## 10. Método y límites

Se utilizó Exa en tres frentes: perímetro financiero/publicidad; proveedores y
contratos; fiscalidad/privacidad. Se solicitaron 97 resultados en 18 búsquedas
(20 + 35 + 42, incluyendo duplicados); **no son 97 fuentes independientes
verificadas**. Se leyeron los pasajes relevantes de fuentes primarias enlazadas
y se descartaron intermediarios, programas homónimos y reproducciones no
confirmadas. Las normas se contrastaron con BOE, EUR-Lex, CNMV, AEAT y AEPD;
los programas con documentos del propio proveedor. Se añadió una búsqueda
dirigida en AEAT para retenciones de persona física, fuera del recuento Exa.
Google/Apple se usan solo
para condiciones técnicas de sus servicios.

Quedan sin acreditar: clasificación de cada una de las ofertas concretas,
autorización de la actividad propia de RWAdar, acuerdos firmados, base del 3 %,
alta fiscal definitiva, cuenta receptora y aceptación de proveedores de cobro.
La investigación reduce incertidumbre, no certifica cumplimiento ni ingresos.
