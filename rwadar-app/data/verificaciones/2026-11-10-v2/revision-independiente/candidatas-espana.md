# Revisión independiente · grupo candidatas-espana · 10/11/2026

Soy revisor independiente: no preparé estos expedientes. Entre las **09:34 y
las 09:48 UTC** abrí yo mismo, sin iniciar sesión, las fuentes primarias que
sostienen los tres expedientes del grupo y los cambios que el grupo da por
críticos. Revisé:

- los registros de la CNMV: índice ERIR, las tres ERIR, Minos como agencia de
  valores, el buscador por entidad, la lista de EAF, PSFP, infraestructuras y
  la ficha del fondo de Azvalor;
- las advertencias de la CNMV, con control positivo;
- la API de Reental y los cuatro PDF de Rentas 4;
- las comunicaciones de Prosegur Cash a la CNMV y su sala de prensa;
- la web de Minos;
- la API de Tokenix y el documento de oferta de RTUK;
- la API de Casa de Outeiro;
- la bolsa de Token City.

Copias, hora, código HTTP y SHA-256 de cada consulta:
[`fuentes/candidatas-espana/inventario-consultas.json`](fuentes/candidatas-espana/inventario-consultas.json)
(50 consultas). Las respuestas crudas de API y los HTML de la CNMV están en
`fuentes/candidatas-espana/crudo/`, fuera de Git. No guardo en el repositorio
los PDF ni las páginas que llevan nombres de personas; de esos dejo solo el
SHA-256 y extractos recortados. El PDF del certificado de Rentas 4 lleva un DNI
en la firma: lo borré después de calcular su SHA-256.

**Veredicto global: aprobado con cambios.** Los tres `no_admitir` se sostienen
con la fuente de hoy, y los cambios del índice ERIR son exactos. No hay ninguna
`admitir_propuesta` ni `retirar_propuesta` que revisar. Hay **una corrección
obligatoria de datos personales** en una copia del grupo (punto 5) y **una
afirmación del expediente de Rentas 4 que el propio PPM desmiente** (punto 2).
Ninguna de las dos cambia una decisión.

## 1. Lo común: CNMV

| Comprobación | Fuente y hora (UTC) | Literal | Resultado |
|---|---|---|---|
| Índice ERIR | https://www.cnmv.es/portal/Consultas/ERIR?lang=es, 09:34:34 | «Empresas de servicios de inversión designadas como ERIR · MINOS SECURITIES, A.V.,S.A. · TOKEN CITY EUROPEAN EXCHANGE A.V., S.A. · URSUS-3 CAPITAL, A.V., S.A.» | **Confirmado.** Las copias del 03/11 y del 05/11 (`2026-11-05-v2/.../erir-indice.txt`) solo tienen a Ursus-3. |
| ERIR de Minos | https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A23875529&lang=es, 09:34:35 | «06/11/2026 · PROSEGUR CASH, S.A. · … emisión de pagarés … denominara “1ª Emisión de Pagarés Prosegur Cash 2026” por importe de 500.000 euros» | **Confirmado.** El SHA-256 es el mismo que el del investigador (`c86799de…`). |
| ERIR de Token City | https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A25988981&lang=es, 09:34:37 | «06/11/2026 · SERIES A GRUPO UAE SA · … acciones representativas del capital social … por importe de 60.000 euros» | Confirmado |
| ERIR de Ursus-3 | `erir_esi.aspx?nif=A86796182`, páginas 0 a 3, 09:43:46–50 | 23 fechas de inscripción; la más reciente es el 23/10/2026 (Hausera SPV 7 y 8) | **Confirmado:** 23 emisiones y la última del 23/10. |
| Minos, agencia de valores | `esis?nif=A23875529`, 09:34:39; programa de actividades (vista 17), 09:43:05 | «333 · 19/12/2025»; recepción y transmisión de órdenes, ejecución, «colocación … sin base en un compromiso firme» | Confirmado. La custodia y la tokenización solo las leí en la web en español del investigador; mi lectura de la web salió en inglés y sin esas líneas. |
| Advertencias, «No autorizadas» | `ResultadoBusqueda?tipo=1&nombre=…`, 09:37:37–58 | Control «Gemini»: 2 advertidas (GEMINI LTD FX, GEMINI OPTION LTD). Reental, Rental Token, Reental America, Aura Inmoinversion, Series RNT, Prosegur Cash, Minos, Tokenix, Toketuk, Toke Tuk y Series A Grupo UAE: «No hay datos disponibles.» | Confirmado |
| Advertencias, «Otras entidades» | `tipo=2`, 09:37:58; https://www.cnmv.es/docportal/aldia/Advertencias_CNMV_Otras.pdf, 09:38:10 | `tipo=2` redirige a `/portal/error` (400). El PDF tiene el mismo SHA-256 (`5e63b537…`); «COMUNITAE» aparece 1 vez y ninguno de los once nombres aparece | **Confirmado.** La sustitución por el PDF es válida. |
| Buscador por entidad | https://www.cnmv.es/portal/Consultas/BusquedaPorEntidad (Playwright), 09:39:12–09:41:18 | Control «Bit2Me»: 2 resultados. «Reental», «Rental Token», «Tokenix» y «Toketuk»: «No se han encontrado resultados». «Prosegur»: PROSEGUR CASH, S.A. entre 3 | Confirmado |

Resumen de las advertencias: [`cnmv/advertencias-cnmv.txt`](fuentes/candidatas-espana/cnmv/advertencias-cnmv.txt).
Resumen de las búsquedas por entidad: [`cnmv/busqueda-por-entidad.txt`](fuentes/candidatas-espana/cnmv/busqueda-por-entidad.txt).

## 2. `reental-rentas-4` · no_admitir · **confirmado con cambios**

| Comprobación | Fuente y hora (UTC) | Literal o dato | Resultado |
|---|---|---|---|
| Emisión abierta | https://backend.reental.co/graphql, `getProjects` 09:35:22–23 y `getCrowdfundingListing` 09:35:24 (mismos cuerpos POST que el investigador) | «Rentas 4 · TOKENS_ON_SALE · PRIVATE · isErir false · 100 EUR · 20000»; `listingTime` 1793815200 = **04/11/2026 18:00 UTC**; creada el 03/11/2026 17:22 UTC; `available` **11.852,95** | **Confirmado.** A las 09:23 quedaban 11.853,45, así que la venta sigue moviéndose. La cifra del investigador era exacta a su hora. |
| Miami 7 | La misma API, 09:35:24 | «TOKENS_ON_SALE · PRIVATE», 100 **USD**, `available` **4.561,00**; el 01/11 tenía 8.948,48 (`2026-11-01-v2/expedientes/reental-miami-7.json`) | **Confirmado** (4.563 a las 09:23). Ojo: Miami 7 cotiza en dólares. |
| Ninguna emisión marcada ERIR | La misma API, 130 proyectos | `isErir`: 130 × false | Confirmado. Aun así, la ERIR de Ursus-3 tiene inscrita a REENTAL TOURIST HOMES, S.A.U. (19/12/2025, obligaciones por 322.500 €). Es la de Murcia 1, que sigue en `COMING_SOON`, privada y sin cambios desde el 01/11. |
| Reental en lo publicado | `2026-11-05.2-v2/escaparate-publicacion.json`, plataforma `reental` | «No hemos comprobado si ahora hay una emisión concreta abierta.» | Confirmado: el radar del 05/11 no comprobaba ninguna oferta. Miami 7 ya estaba abierta el 01/11 y se rechazó entonces. |
| Documentos | Los 4 PDF de `d23t4e7dm0xzj0.cloudfront.net/.../7c77a956-…/docs/`, 09:35:58–09:36:01 | PPM `327323cf…`, acuerdo `f9d25105…`, certificado `37859c0b…`, dosier `23e0dc59…` | **Confirmado.** Los cuatro tienen el mismo SHA-256 que los del investigador. |
| Préstamo intragrupo | PPM | «AURA INMOINVERSION, SL (la “Prestataria”) es una sociedad del grupo Reental» · «remuneración fija anual equivalente al doce por ciento (12 %)» · «Al vencimiento de treinta y seis (36) meses» | Confirmado |
| Mínimo | PPM y acuerdo 1.1 | «Los inversores no estadounidenses que participen bajo el Reglamento S podrán adquirir un mínimo de un (1) ReentalToken, por un total de EUR 100.» | Confirmado |
| Derecho, salida y ley | Acuerdo 1.1, 7.3 y 9.8 | «Cada Token representa una participación de membresía en el Emisor» · «No existe garantía de admisión a negociación, mercado secundario, recompra, rescate…» · «leyes del Estado de Florida» | Confirmado |
| Solo profesionales | Dosier, «AVISO LEGAL» | «Uso Exclusivo para Inversores Profesionales» | Confirmado |
| Supervisión | PPM, portada y aviso | «NINGUNA AUTORIDAD … HA APROBADO O DESAPROBADO»; Rental Token S.L. y demás «NO ACTÚAN COMO ASESORES DE INVERSIÓN NI COMO INTERMEDIARIOS DE VALORES» | Confirmado |
| EAF nacional nº 21 | Lista de EAF de la CNMV (`listadoentidad.aspx?id=1&tipoent=13`), 09:46:10 | «21 - 12/01/2024», persona física | Confirmado. El certificado «no constituye … una aprobación o validación»; además dice que revisó la «comercialización … a Inversores Españoles según la Regulation S». |

**Lo que el expediente dice mal (corrección obligatoria, no cambia la decisión).**
El claim `accesoEspana` del PPM dice en `alcanceYLimites`: «No define
“inversores calificados” para España ni cita ninguna exención del Reglamento de
folletos de la UE». **El PPM sí la cita.** Tiene un apartado «AVISO A RESIDENTES
DEL ESPACIO ECONÓMICO EUROPEO» que dice: «LA COMPAÑÍA NO HA REALIZADO NI
REALIZARÁ UNA OFERTA DE REENTALTOKENS … AL PÚBLICO EN ESE ESTADO MIEMBRO …
SALVO QUE PUEDA» hacerla a «INVERSORES CUALIFICADOS», a «MENOS DE 100 O … 150
PERSONAS FÍSICAS O JURÍDICAS (QUE NO SEAN INVERSORES CUALIFICADOS)» o en otras
ofertas exentas. Define la «DIRECTIVA DE PROSPECTO» como el «REGLAMENTO (UE)
2017/1129». La portada añade: «NO SE HA REALIZADO NINGUNA ACCIÓN EN NINGUNA
JURISDICCIÓN PARA PERMITIR UNA OFERTA PÚBLICA DE LOS VALORES». Extracto en
[`reental/rentas-4-extractos-revisor.txt`](fuentes/candidatas-espana/reental/rentas-4-extractos-revisor.txt).
El dato corregido refuerza el `no_admitir`. En la UE es una colocación privada:
inversores cualificados o un grupo de menos de 150 personas por país.

**Conflicto que falta registrar.** El PPM dice: «La presente Oferta se abrirá
el 23 de octubre de 2026». La API pone el inicio de la venta el 04/11/2026 a las
18:00 UTC. El plazo de 90 días cuenta «después de la fecha de lanzamiento», que
queda sin fijar.

**Tres datos de referencia** (no se publican):

| Dato | Texto | Caracteres | Valoración |
|---|---|---|---|
| Mínimo | «Desde 100 € en una colocación privada (10/11)» | 45 | Correcto |
| Acceso desde España | «No confirmado: oferta privada; el dosier dice que es solo para inversores profesionales» | 87 | Correcto. Sería más preciso así: «Solo colocación privada: en la UE, inversores cualificados o menos de 150 por país» (82). |
| Salida | «Devolución prevista a los 36 meses si la prestataria paga; sin mercado secundario garantizado» | 93 | Correcto |

Los tres están en castellano llano y respaldados.

## 3. `prosegur-cash-pagares-tokenizados-2026` · no_admitir · **confirmado con cambios**

| Comprobación | Fuente y hora (UTC) | Literal o dato | Resultado |
|---|---|---|---|
| Inscripción | ERIR de Minos (punto 1), 09:34:35 | «06/11/2026 · … 500.000 euros realizada por PROSEGUR CASH, S.A.». La CNMV añade que la inscripción «no implica que la CNMV haya validado las condiciones de la emisión» | Confirmado |
| Comunicaciones de Prosegur Cash | https://www.prosegurcash.com/accionistas-inversores/comunicaciones-cnmv (Playwright), 09:42:47; pestaña «Información Privilegiada», 09:46:44; API de la lista de OIR, 09:41:33 (mismo SHA-256, `e1bb810f…`) | Última OIR de 2026: «OIR - Registro Programa Pagarés AIAF 2026» (16/06/2026). Ninguna entrada de OIR ni de información privilegiada habla de pagarés tokenizados, de Minos ni de registros distribuidos | **Confirmado.** |
| Sala de prensa | https://www.prosegurcash.com/media/prensa, 09:42:39 | Última nota: 03/11/2026, resultados de los nueve meses. Nada sobre esta emisión | Confirmado |
| Web de Minos | https://minos-securities.com/, 09:42:33; www.minossecurities.com, 09:42:21 | Describe sus servicios y el nº 333; no menciona la emisión. La web sin guion corta la conexión | Confirmado |
| Búsqueda abierta (solo para descubrir) | WebSearch, ~09:41 | Ninguna noticia ni documento con las condiciones de estos pagarés tokenizados | Sin hallazgos |

**Contexto útil, no es prueba.** La OIR del 16/06/2026 dice que los pagarés
**ordinarios** de Prosegur Cash (programa AIAF) tienen «un importe nominal
unitario de cien mil euros (100.000 €)» y que «podrán ofrecerse exclusivamente
a clientes profesionales, contrapartes elegibles e inversores cualificados».
No dice nada de la emisión tokenizada, pero indica que lo más probable es que
tampoco sea para particulares. Conviene añadirlo a la nota de vigilancia.
Extracto: [`prosegur/prosegurcash-oir-api-y-aiaf-2026.txt`](fuentes/candidatas-espana/prosegur/prosegurcash-oir-api-y-aiaf-2026.txt).

**Correcciones de redacción:**

- **«Última comunicación a la CNMV del 16/06».** Debe decir «última OIR
  publicada en su web, del 16/06». La sociedad comunica también información
  privilegiada e información financiera, y su última nota de prensa es del
  03/11.
- **«Desde hoy figura en el índice ERIR»** (en `registros`). Debe decir
  «figura el 10/11; el 05/11 no figuraba». No sabemos qué día entró.

Los tres datos de la tarjeta están en `null`. Es correcto: no hay ninguna
fuente.

## 4. `tokenix-toketuk-flota-cruceros-hito-1` · no_admitir · **confirmado con cambios**

| Comprobación | Fuente y hora (UTC) | Literal o dato | Resultado |
|---|---|---|---|
| Campaña abierta | https://saas-tokenix2-base-api.token-city.com/v2/pfp/project/expand/…?limit=50, 09:43:14 | Proyecto 162: «CAMPAIGN · 2026-10-30 → 2027-01-31 · invested 181800 · invested_tokens 909 · supply 1025»; RTUK a 200 €, mínimo 200 | **Confirmado.** El SHA-256 es el mismo que el del investigador de las 09:15 (`9c4688a8…`): no ha cambiado nada. |
| Documento de oferta | `…/project/162/document/280`, 09:43:15 | Mismo SHA-256 (`2a16d9f3…`). «no ha sido revisado por la Comisión Nacional de Mercado de Valores» · «no serán transmisibles y no tendrán consideración de valores» · «sin que proceda devolución de las aportaciones» · «Retorno anual estimado 48%» · «máxima pérdida el 100%» · «inversores seleccionados previamente por el Emisor de forma privada» | Confirmado |
| Reclamo | Descripción del proyecto 162 en la API | «hasta alcanzar un 400% de retorno … (¡Multiplicas tu inversión por 4!)» | Confirmado |
| Conflicto de fechas | Documento: «Etapa 1: a partir de 04 de septiembre de 2026 hasta el 04 de marzo de 2027»; API: 30/10/2026 → 31/01/2027 | — | Confirmado, ya está registrado como `en_conflicto`. |
| Sin registro ni advertencias | Buscador por entidad y advertencias (punto 1) | — | Confirmado |
| 7 Islas Tok | ERIR de Ursus-3, 09:43:46: «obligaciones … 594.000 euros (… token A por 429.000 euros y token B por 165.000 euros), realizada por 7 ISLAS TOK, S.A.»; API de Tokenix: proyectos 70 y 69, «7ISLAS TOK», 429.000 € y 165.000 € | — | **Identificación confirmada.** |
| Documentos legales | https://www.tokenix.eu/legal/20241202_TOKENIX_T%26C.pdf y `…_AvisoLegal.pdf`, 09:47:38 | Mismo SHA-256 (`cc7514c0…`, `4d3f65b0…`) | Confirmado |

**Correcciones de redacción:**

- **«La vendió Tokenix y está cerrada».** Es inexacto. Las dos series están
  **vendidas por completo** (1.716 de 1.716 y 300 de 300) y su plazo terminó
  el 31/08/2026. Pero la API sigue marcando la serie «Propiedad» (proyecto 69)
  como `CAMPAIGN`; solo la «Concesión» (70) está `CLOSED`. Debe decir:
  «agotada, con el plazo vencido el 31/08/2026».
- **«Marca blanca de Token City».** Es una deducción: la API está en un
  servidor de token-city.com y no hay ningún texto que lo diga. Debe decir:
  «usa la plataforma de Token City (su API está en token-city.com)».

**Pista que el grupo no cita.** La misma API tiene el **proyecto 177, «Tu
Asiento VIP en la Revolución Financiera»**: preventa de 1.000.000 de acciones
de Tokenix Global a 1 € (símbolo TKX-EQ, mínimo 50 €). Está en
`PRE_CAMPAIGN`, sin fecha de inicio y sin documentos. Su texto dice: «con un
valor de salida al público de 2€» y «sin periodos de carencia ni riesgos».
Hoy no se puede comprar y no hay que admitirla. Conviene apuntarla en el
resumen como pista que hay que evitar o vigilar. La ERIR de Ursus-3 tiene
inscritas 5.000.000 de acciones «Clase B» de Tokenix Global (08/05/2026), pero
no consta que sean las de esta preventa.

**Tres datos de referencia** (no se publican):

| Dato | Texto | Caracteres |
|---|---|---|
| Mínimo | «Desde 200 € (10/11)» | 19 |
| Acceso desde España | «No confirmado: oferta privada sin entidad supervisada por la CNMV» | 65 |
| Salida | «No hay: derechos no transmisibles y sin devolución de lo aportado al final» | 74 |

Los tres son correctos, están en castellano llano y están respaldados.

## 5. Datos personales en las copias del grupo · **corrección obligatoria**

Busqué en todo `grupos/candidatas-espana/` fuera de `crudo/`:

- correos;
- DNI y NIE;
- teléfonos;
- tratamientos («D.», «Dña.»…);
- nombres de pila seguidos de apellido;
- cargos.

También comparé el texto de mis PDF con el de las copias del investigador.

- **`grupos/candidatas-espana/fuentes/reental/ret-4-1793792807997_certificado_revision_rnt_spv_25.txt`**
  tiene dos datos personales sin recortar:
  - **la línea 19**, con el domicilio profesional (calle y número) de la EAF,
    que es una persona física;
  - **la línea 77**, con su **correo personal** en un dominio de correo
    gratuito.

  El nombre y el DNI sí están recortados, pero el domicilio y el correo
  identifican igual a la persona. Hay que recortar las dos líneas antes de
  cualquier commit. Su resumen dice que solo quitó «la dirección del contrato
  de Toketuk».
- Lo demás está bien:
  - los nombres del PPM, del acuerdo, del dosier, del documento de Toketuk y
    de la lista de OIR de Prosegur Cash están cambiados por «[nombre
    recortado]»;
  - no hay URL firmadas;
  - los correos y teléfonos que quedan son de empresas (Urbanitae, Tokenix,
    Reental, Minos).
- El único nombre que queda es el del «Premio de periodismo …» del menú de la
  CNMV: es el título público de un premio, no un dato personal.
- Los expedientes y `resumen-candidatas-espana.md` no tienen ningún nombre de
  persona.

## 6. Muestreo de lo que el grupo da «sin cambios»

| Pista | Fuente y hora (UTC) | Literal o dato | Resultado |
|---|---|---|---|
| Casa de Outeiro (retirada el 05/11) | API de Token City `…/issuance/slug/casa-de-outeiro/expand/…,campaign,campaign_progress`, 09:44:57; pestañas, 09:44:40 | Mismo SHA-256 que el investigador (`ebffd3e4…`, `3ec67c48…`); «CAMPAIGN · end_date 2026-10-31 · extend_days None · invested 1123000»; mínimo 2.000.000 €; el 05/11 tenía 1.121.000 € | **Confirmado:** 2.000 € más que el 05/11 y sin prórroga. Bien no volver a proponerla. |
| Lista de PSFP | https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/listado-proveedores.aspx?lang=es, 09:45:06 | Las líneas con razón social son idénticas a las de la copia del 03/11 (no hay ninguna diferencia) | Confirmado |
| Infraestructuras del régimen piloto | https://www.cnmv.es/portal/consultas/Rectoras/ListadosIM.aspx?lang=es, 09:45:11 | «Bit2Me STX (SNL TRD)» y «SECURITZE (SNL TRD)», igual que el 05/11 | Confirmado |
| Bolsa de Token City | https://exchange.token-city.com/ (Playwright), 09:45:31 | «Oportunidades de inversión · PRÓXIMAMENTE · … CANDO1 · En estudio»; el texto es idéntico al del investigador | Confirmado |
| Azvalor Blockchain, FI | https://www.cnmv.es/portal/Consultas/IIC/fondo.aspx?nif=V23815566, 09:45:37 | «5982 · 03/10/2025»; depositaria «BNP PARIBAS S.A., SUCURSAL EN ESPAÑA». La ficha solo tiene «Datos generales» y las vistas 2 y 3 dan error 400 | **Confirmado:** no tiene folleto ni datos fundamentales publicados. |

## Bloqueos

- **Rentas 4 y Miami 7.** La venta es «PRIVATE»: sin iniciar sesión no se puede
  ver quién puede comprar.
- **Pagarés de Prosegur Cash.** No hay documento ni condiciones públicas. No
  consulté el registro de folletos de la CNMV.
- **www.minossecurities.com** corta la conexión.
- **Buscador por entidad de la CNMV.**
  - El formulario no responde a peticiones directas: hubo que usar Playwright.
  - Con «Prosegur Cash» no devolvió texto de resultado (dos intentos). Lo
    comprobé con «Prosegur».
- **Web de Minos.** Me salió en inglés, con textos sin traducir. La custodia y
  la tokenización como servicios de Minos solo las vi en la copia en español
  del investigador.

## Correcciones obligatorias

1. **Datos personales.** En
   `grupos/candidatas-espana/fuentes/reental/ret-4-1793792807997_certificado_revision_rnt_spv_25.txt`
   hay que recortar el domicilio (línea 19) y el correo personal (línea 77) de
   la EAF persona física.
2. **`reental-rentas-4`, claim `accesoEspana` del PPM.** Hay que cambiar «No
   define “inversores calificados” para España ni cita ninguna exención del
   Reglamento de folletos de la UE» por lo que dice el PPM: en el EEE solo se
   ofrece a inversores cualificados, a menos de 150 personas por país o con
   otra exención del Reglamento (UE) 2017/1129, y «NO SE HA REALIZADO NINGUNA
   ACCIÓN … PARA PERMITIR UNA OFERTA PÚBLICA».
3. **`reental-rentas-4`, fechas.** Hay que registrar el conflicto: el PPM dice
   que la oferta «se abrirá el 23 de octubre de 2026» y la API pone la venta
   el 04/11/2026 a las 18:00 UTC.
4. **`tokenix-toketuk-flota-cruceros-hito-1` y resumen, 7 Islas Tok.** Hay que
   cambiar «está cerrada» por «agotada (1.716/1.716 y 300/300), con el plazo
   vencido el 31/08/2026; la API aún marca la serie “Propiedad” como
   CAMPAIGN».

## Correcciones recomendadas (no cambian nada publicado)

- **Prosegur Cash:**
  - cambiar «última comunicación a la CNMV del 16/06» por «última OIR en su
    web, del 16/06»;
  - cambiar «Desde hoy figura en el índice ERIR» por «figura el 10/11; el
    05/11 no»;
  - añadir a la nota de vigilancia que sus pagarés AIAF ordinarios son de
    100.000 € y solo para profesionales e inversores cualificados.
- **Tokenix:**
  - cambiar «marca blanca de Token City» por «usa la plataforma de Token City»;
  - apuntar la preventa de acciones de Tokenix Global (proyecto 177, sin
    documentos) como pista que hay que evitar o vigilar.
- **Miami 7:** decir que su precio es de 100 USD.
