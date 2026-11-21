# Auditoría independiente · ámbito «spiko» · 21/11/2026

Fichas: `spiko-letras-del-tesoro-euro`, `spiko-letras-del-tesoro-dolar` y
`spiko-smart-cash-euro`. No investigué ni monté estas fichas. Abrí yo mismo
todas las fuentes entre las **20:14 y las 20:24 UTC** del sábado 21/11/2026,
con peticiones normales: curl con su agente por defecto, Chrome sin trucos
de ocultación para las páginas que se pintan con JavaScript, sin cuentas ni
alta. Las copias están fuera del repositorio, en
`/tmp/auditoria-2026-11-21/spiko/r2/`.

Lo auditado es lo publicado (`2026-11-20.2-v2/escaparate-publicacion.json` y
`documentacion-ofertas.json`) más los cambios de `DECISIONES-COORDINADOR.md`
§2 y §4, los textos de `expedientes/` y las correcciones de
`revision-independiente/spiko.md`. Para ver lo que sale en pantalla pasé las
tres fichas, ya con esos cambios, por `resumenOferta`
(`rwadar-site/assets/ficha-editorial-20261022.js`). También miré cómo las
pinta la web (`rwadar-20260820.js`) y cómo re-fecha el motor
(`entrega/preparar.mjs`: solo re-fecha las referencias con etiqueta de
tarjeta, es decir «Mínimo de inversión», «Acceso desde España», «Salida» y
«Reembolso»).

## En pocas palabras

- **Las cifras están bien y no hay valor liquidativo nuevo.** A las
  20:14:05 UTC, y otra vez a las 20:23:49 UTC, la API pública de Spiko daba la
  misma VL del viernes 20/11, con la misma huella que el vigía:
  Letras Euro 1,063496 € (calculada a las 17:18:23 UTC y fechada por Spiko el
  22/11), Letras Dólar 1,103573 $ (17:18:10 UTC) y Spiko Euro 1,017886 €
  (16:37:37 UTC). Las próximas llegan el lunes 23/11: hacia las 18:00 UTC las
  de Letras y hacia las 19:30 UTC la de Spiko Euro. Mis cálculos: 2,452 %
  (Euro, 31 días), 4,002 % (Dólar, 31 días) y 2,837 % (Spiko Euro, 7 días).
  Cuadran con el 2,45 %, el 4,00 % y el 2,84 % que se publican.
- **Lo que falla es lo que la ficha enseña alrededor de esas cifras.**
  1. **Spiko Euro y España.** §2 no dice claramente si entra «Sin confirmar».
     Si entra tal como está montado, la ficha dirá cosas que no son verdad
     (detalle en el hallazgo 1).
  2. **Siguen fechas viejas en las tres fichas**, en contra de lo que pidió
     Víctor («que no quede nada viejo»). Hay 16 referencias viejas en Letras
     Euro, 8 en Letras Dólar y 7 en Spiko Euro, con «Consultado el 30/09»,
     «22/10», «01/11» y «03/11». En Letras Dólar hay además un patrimonio
     desfasado.
  3. **Letras Dólar no tiene ningún enlace a la CNMV**, aunque la ficha
     afirma la inscripción en la CNMV.
  4. **A las dos Letras les falta un riesgo** que el KID llama «importante»:
     el del registro en blockchain y el de la cartera digital.

## Hallazgos obligatorios

### 1. Spiko Euro · Acceso desde España: falta la decisión, y con «Sin confirmar» la ficha dice cosas falsas

- §2 dice: «Smart Cash Euro: 2,84 % (VL del 20/11). La AMF sigue sin publicar
  la ficha del fondo: se mantiene el aviso de acceso, con la consulta de hoy».
  No dice si entra el cambio crítico del expediente (de «Sí» a «Sin
  confirmar»), que el revisor da por bueno. La regla general de §2 («entra la
  propuesta del expediente») haría que entrara.
- Lo simulé con el cambio y `disponibleEs: true`. Con «Sin confirmar» en la
  referencia, `resumenOferta` devuelve
  `{"texto":"Sin comprobar si se puede contratar desde España","estado":"sin_comprobar"}`,
  sin fuente. En la web eso se ve así:
  - la lista y «Lo esencial» dicen «Sin confirmar». Eso está bien;
  - el bloque «Acceso, salida y costes, con su fuente» dice **«Desde España:
    Sin comprobar si se puede contratar desde España»**, sin enlace. Es
    falso: se ha comprobado tres días seguidos;
  - «Lo que hemos comprobado» pasa a **«✗ Se contrata hoy desde España · No
    consta en la fuente que se contrate desde España.»** También es falso. La
    fuente que se cita,
    <https://docs.spiko.io/documentation/product_overview/fund_availability>
    (20:14:52 UTC, SHA-256 `179ef546…`, la misma huella), dice hoy
    «🇪🇸 Spain ✅ ✅ ✅ ❌» y «The Smart Cash column covers all four share
    classes: Spiko Euro…».
- **Corrección exacta:** que §2 lo diga por escrito, de una de estas dos
  maneras.
  - **(a) Se mantiene lo publicado** (es lo que da a entender «se mantiene el
    aviso de acceso»): la referencia «Acceso desde España» se queda con
    «Disponible para particulares residentes en España según Spiko, tras el
    alta y la verificación de identidad (KYC)», con `fechaDato` 2026-11-13 y
    consulta del 21/11. El aviso sobre la CNMV y la AMF se re-fecha al 21/11.
  - **(b) Entra «Sin confirmar».** Antes de publicar hay que cambiar
    `resumenOferta` (web y app) para que, con una referencia que empiece por
    «Sin confirmar», enseñe su texto y su fuente en lugar de «Sin comprobar
    si se puede contratar desde España». El motivo de «Se contrata hoy desde
    España» tiene que decir «Spiko lo ofrece a residentes en España, pero
    ningún registro público muestra que este fondo esté dado de alta aquí».
    Si no se puede tocar el código hoy, queda la opción (a).

### 2. Letras Euro: 16 de sus 19 referencias siguen con fechas viejas

El motor solo re-fecha «Mínimo de inversión (clase EUTBL)», «Acceso desde
España» y «Reembolso». El grupo no propuso quitar nada, así que se quedan
estas, cada una con «Consultado el …» en «Datos con su fecha»:

- 30/09: «Suscripción inicial mínima publicada», «Gestión publicada» (dos
  veces) y «Suscripción inicial mínima»;
- 22/10: «Suscripción inicial publicada · 22/10/2026», «Moneda · 22/10/2026» y
  «Comisión de gestión · 22/10/2026»;
- 01/11: «Estado de la oferta», «Mínimo de inversión», «Comisiones»,
  «Custodia», «Salida», «Reembolso inmediato», «Acceso desde España
  (particulares)» y «Riesgos», todas con «· consulta 01/11/2026». El alcance de
  «Estado de la oferta» todavía dice «API: NAV 01/11/2026»;
- 20/11: «Rentabilidad publicada · 31 días». Su alcance dice «consultado el
  20/11/2026», mientras que el texto nuevo de la rentabilidad dice
  «consultado el 21/11/2026».

Esto también se ve en «Acceso, salida y costes»: la fila «Costes» sale de
dos referencias viejas y se lee «Comisiones: Gastos de gestión y otros
gastos administrativos u operativos: 0,25 % del valor de su inversión al año.
Este porcentaje se basa en los costes reales del último año.; Comisión de
gestión: 0,25 %», con fuentes consultadas el 01/11 y el 22/10.

Todo se puede comprobar hoy:

- <https://data.spiko.io/eutbl/> (20:15:59 UTC): «MINIMUM INITIAL SUBSCRIPTION
  1 EUR», «MANAGEMENT FEES 0.25%», «CURRENCY EUR»;
- GECO c79399 (20:18:30 UTC): «Statut : Vivant», «Type de souscripteurs : Tous
  souscripteurs», «Dernière valeur liquidative connue au 19/11/2026 :
  1.06328 €»;
- el KID en español, el folleto en inglés y las condiciones de uso tienen el
  mismo SHA-256 (20:16:55–20:16:58 UTC);
- docs «Deposits and Withdrawals» (20:14:53 UTC): «Instant transfers are
  supported for amounts up to €500,000 per day».

**Corrección exacta:**

- Con `referenciaQuita`, quitar las 7 de data.spiko.io del 30/09 y del 22/10
  y «Mínimo de inversión · consulta 01/11/2026». Repiten lo que ya dice
  «Mínimo de inversión (clase EUTBL)».
- Con `referencia`, re-fechar al 21/11 «Estado de la oferta», «Comisiones»,
  «Custodia», «Reembolso inmediato» y «Riesgos», sin « · consulta
  01/11/2026». El alcance de «Estado de la oferta» queda así: «GECO
  21/11/2026: vivo, todo tipo de suscriptores; VL del 20/11/2026 (1,063496 €)».
- «Salida · consulta 01/11/2026» y «Acceso desde España (particulares) ·
  consulta 01/11/2026» se re-fechan con otro nombre, por ejemplo «Órdenes de
  reembolso (KID)» y «Particulares admitidos (condiciones de uso)», para que
  no choquen con las etiquetas de la tarjeta.
- «Rentabilidad publicada · 31 días» pasa a consulta del 21/11, con el alcance
  «… consultado el 21/11/2026 …».

### 3. Letras Dólar: 8 de sus 11 referencias son viejas, y el patrimonio está desfasado

- Siguen con consulta del 01/11 «Estado de la oferta», «Mínimo de inversión»,
  «Comisiones», «Moneda y tipo de cambio», «Custodia», «Riesgos» y
  «Patrimonio y partícipes», y con consulta del 20/11 «Rentabilidad publicada ·
  31 días». La fila «Costes» dice «Consultada el 01/11/2026».
- «Patrimonio y partícipes · consulta 01/11/2026» enseña «totalAssets
  171243227.21 USD · numberOfHolders 857». Hoy la API
  <https://public-api.spiko.io/v0/share-classes/USTBL/totals> (20:14:10 UTC)
  da `"totalAssets":{"value":"176970363.26","currency":"USD"},"numberOfHolders":904`,
  y data.spiko.io/ustbl (20:16:05 UTC) dice «AUM $176.97M», «USERS 904».
- **Corrección exacta:** cambiar esa referencia por «Patrimonio y
  titulares»: «176,97 millones de dólares · 904 titulares», con `fechaDato`
  2026-11-20, consulta 2026-11-21 y fuente `https://data.spiko.io/ustbl/`, o
  quitarla. Las demás se re-fechan al 21/11, sin « · consulta 01/11/2026»:
  GECO c79398 a las 20:18:38 UTC daba «Statut : Vivant»; el KID en español
  (`c1ce5400…`) y el folleto en inglés (`7457e79f…`) son los mismos. Quitar
  «Mínimo de inversión · consulta 01/11/2026», que repite «Mínimo de
  inversión». «Rentabilidad publicada · 31 días» pasa a consulta del 21/11.

### 4. Spiko Euro: 7 de sus 10 referencias son viejas

- Siguen con consulta del 03/11 «Comisión de gestión», «Riesgo (KID)»,
  «Ajuste del valor liquidativo», «Registro de la SICAV en España» y «Web
  frente al KID». Siguen con consulta del 20/11 «Rendimiento neto publicado»
  (su alcance dice «consultado el 20/11/2026») y «Aprobación del
  compartimento». La fila «Costes» dice «Consultada el 03/11/2026».
- Todo se sostiene hoy:
  - folleto de GECO 438274 (20:17:00 UTC, `940559b4…`): «Frais de gestion
    financière … 0,25% TTC», «0,10% TTC maximum», «Swing Pricing ne pourra
    excéder 0,50%»;
  - KID en español (`53effea2…`): escenarios de 9 980, 9 990, 9 990 y
    10 100 EUR;
  - CNMV (20:17:33 UTC): «SPIKO SICAV · 2380 · 30/01/2026»;
  - web en español, pintada a las 20:15:52 UTC: «Interés a tipo fijo»,
    «Garantizado por contrapartes», «recibe a cambio un rendimiento diario
    garantizado»;
  - certificado de la AMF (`709e0585…`): «Paris, 2026-02-23», «SCV20260075».
- **Corrección exacta:** re-fechar las siete al 21/11, sin cambiar su
  valor. El alcance de «Rendimiento neto publicado» pasa a decir
  «consultado el 21/11/2026».

### 5. Letras Dólar: la ficha afirma la inscripción en la CNMV sin ningún enlace a la CNMV

- El texto nuevo de «Acceso desde España» («…; la SICAV está inscrita en la
  CNMV») y la métrica «Supervisor» («Spiko SICAV inscrita en la CNMV para su
  comercialización (n.º 2380)») lo afirman. Pero ni `fuentesActuales` ni
  `documentacion.fuentes` de esta ficha tienen una dirección de la CNMV, y la
  referencia cita la tabla de Spiko. La página de Spiko (20:14:52 UTC) no
  nombra a la CNMV.
- El dato es cierto:
  <https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es>
  (20:17:33 UTC) dice «SPIKO SICAV · 2380 · 30/01/2026 · SICAV · FRANCIA ·
  IIC Comunitaria».
- **Corrección exacta:** añadir esa dirección a `fuentesActuales` y a
  `documentacion.fuentes` de `spiko-letras-del-tesoro-dolar`, como ya tiene
  Letras Euro.

### 6 y 7. Las dos Letras: el riesgo del KID deja fuera la blockchain y la cartera digital

- Hoy, a las 20:16:55 y 20:16:56 UTC, los KID en español (mismo SHA-256) dicen
  en «Riesgos importantes para el Producto no tenidos en cuenta en este
  indicador»: «Riesgos relacionados con el uso de un TRD…» y «Riesgos
  relacionados con la cartera necesaria para asegurar y transferir las
  acciones en forma de tokens…», que pueden «provocar una pérdida total o
  parcial de la inversión para el inversor».
- Las fichas solo dicen «Riesgo KID: 1 de 7» (Euro) y «1 de 7, más riesgo de
  cambio» (Dólar), y ningún aviso lo cuenta. Spiko Euro sí aclara lo que su
  KID deja fuera.
- **Corrección exacta:**
  - Euro, métrica «Riesgo KID»: «1 de 7, sin contar los riesgos del registro
    en blockchain y de la cartera digital (el KID los deja fuera)».
  - Dólar: «1 de 7, sin contar el riesgo de cambio ni los del registro en
    blockchain y la cartera digital (el KID los deja fuera)».

## Hallazgos recomendados

8. **Letras Euro y Dólar · «Acceso desde España»: el texto mezcla dos
   fuentes.** La referencia cita docs.spiko.io (dato del 13/11), pero «la
   SICAV está inscrita en la CNMV» viene de la CNMV (inscripción del
   30/01/2026). Quien pulse «Ver fuente» no lo encontrará ahí. Propuesta:
   «Disponible para residentes en España tras el alta y la verificación de
   identidad, según la tabla de países de Spiko». La inscripción ya está en
   «Supervisor». Sigue empezando por «Disponible», así que la tarjeta sigue
   diciendo «España: Sí».
9. **Letras Dólar · mínimo si ingresas euros.** Hoy docs.spiko.io
   «available_products» (20:22:52 UTC) dice que Spiko T-Bills Dollar acepta
   euros «through the intermediaryShareClasses mechanism». La API de la clase
   USTBL (20:14:41 UTC) da `"intermediaryShareClasses":[["EUR","62fb4d4d-…"]]`,
   y esa clase (eurUSTBL, FR001400SBD3) tiene
   `"minimumInitialSubscription":"1000"`. El folleto dice 1 EUR. La ficha
   dice «Moneda: USD (depósito en EUR con conversión)» y no cuenta el
   conflicto. Propuesta para la métrica «Moneda»: «USD; si ingresas euros,
   Spiko los cambia a dólares (la API de Spiko pone 1.000 € de mínimo inicial
   para esa vía y el folleto, 1 €: confírmalo con Spiko)».
10. **Spiko Euro, si entra «Sin confirmar» · lenguaje llano.** La
    referencia propuesta dice «tras el alta y el KYC». El revisor ya pidió
    quitar «KYC» en las Letras. Además lleva `fechaDato` 21/11, mientras que
    la página que enlaza está fechada el 13/11 y marca España con ✅.
    Propuesta (la del revisor, 117 caracteres): «Sin confirmar: Spiko lo
    ofrece en España, pero ningún registro público muestra que este fondo
    esté dado de alta aquí.»

## Nota para el montaje (no es un dato visible)

- §2 pasa Letras Dólar a `actualizar`, pero su expediente sigue con
  `"decision": "mantener"`. El motor comprueba que la decisión del
  expediente sea la de `decisiones.json` («decisión del expediente»), así
  que fallará si no se igualan.

## Lo que comprobé hoy y se sostiene

| Dato visible | Fichas | Fuente y hora UTC | Resultado |
|---|---|---|---|
| Rentabilidad 2,45 % / 4,00 % / 2,84 %, con su VL y su fecha | 3 | API `…/yield` y `…/net-asset-values/…/latest`, 20:14:05–20:14:10; serie desde el 20/09 | Igual que el vigía (02a03185…, 98a9113d…, 859689c2…, 6591d431…, 9b7f7866…); recalculado 2,452 / 4,002 / 2,837 % |
| VL nueva después de las 18:00 UTC | 3 | API, 20:14:05 y 20:23:49 | No hay. Próximas el 23/11 a las 18:00 (Letras) y a las 19:30 (Spiko Euro) |
| Web: 2,45 %, 4,00 %, 2,84 %; «Depósito inicial mínimo €1 / $1 / €1»; «Crea tu cuenta» | 3 | web en español pintada, 20:15:36–20:15:52 | Correcto (el HTML sin pintar aún dice 2,35 % y 3,97 %, de antes) |
| Mínimo 1 EUR / 1 USD / 1 EUR, sin «por participación» | 3 | folleto en inglés (`7457e79f…`); API `minimumInitialSubscription "1"`; folleto de GECO, Action EUR FR0014015LD3 1 EUR | Correcto |
| España: tabla de países y restricciones | 3 | docs «Fund Availability» 20:14:52 («Spain ✅ ✅ ✅ ❌», «Last updated: November 13, 2026»); «Onboarding Restrictions» 20:14:53 (España no excluida) | Correcto para las Letras; Spiko Euro, ver hallazgo 1 |
| CNMV: SICAV n.º 2380 (30/01/2026), Aldana Capital comercializadora, Spiko Finance n.º 5325 (14/01/2026, recepción de órdenes sobre IIC) | 3 | CNMV, 20:17:33–20:17:37 | Correcto; no desglosa los fondos |
| Advertencias de la CNMV: Spiko, Twenty First Capital, Aldana, Amundi | 3 | CNMV, 20:17:38–20:17:43: «No hay datos disponibles»; control «Trading»: «Página 1 de 16» | Sin advertencias |
| GECO: c79399 y c79398 vivos, «Tous souscripteurs», SCV20240014 / 13, 05/04/2024; c124199 sin publicar | 3 | API de GECO 20:18:05; pintadas 20:18:30–20:18:43 («OPC :» vacío, «Aucune part disponible») | Correcto |
| Pasaporte de Spiko Finance hacia España desde el 08/01/2026 | 3 | REGAFI, 20:21:29 (`fdf10d2d…`, la misma huella) | Correcto |
| PDF: 3 KID en español, folleto en inglés, condiciones, certificado de la AMF, folleto de GECO | 3 | descargados 20:16:55–20:17:00 | Mismo SHA-256 que el vigía y la documentación |
| Gastos 0,25 %, entrada y salida 0 %, riesgo 1 de 7, «dirigido a todo tipo de inversores», CACEIS | 2 Letras | KID en español | Correcto (salvo el hallazgo 6/7) |
| Reembolso diario, corte 11:30, límite del 10 %, festivos de Francia y EE. UU. | 2 Letras | KID; folleto de GECO («seuil de 10 %», «20 valeurs liquidatives sur 3 mois») | Correcto |
| Spiko Euro: 15:00, J+1, 25 %, 20 VL en 3 meses, swing ≤ 0,50 %, 0,25 % + 0,10 %, delegación en Amundi, contraparte fuera del 1 de 7, 3 meses, escenarios | Spiko Euro | folleto de GECO §3.2.4; KID en español; certificado de la AMF | Correcto |
| Avisos web frente a documentos («Interés a tipo fijo», «Garantizado por contrapartes», «Sociedad gestora Amundi Asset Management», «No existen límites de retirada», «sin preaviso y sin límite de importe») | Spiko Euro, Dólar | web pintada 20:15:45–20:16:14 y HTML de «Particulares» 20:14:51 | Siguen ahí: los avisos hacen falta |
| Reclamaciones ante Twenty First Capital | Spiko Euro | KID «¿Cómo puedo reclamar?» | Correcto |
| Cambio de moneda sin comisión, BFIX de las 11:30 | Dólar | web en español y docs «Currency Exchange», 20:20:14 | Correcto |
| Enlaces: botón y fuentes de las tres fichas | 3 | todos 200 (docs.spiko.io redirige a la barra final) | Correcto |

En total abrí hoy y comparé con su fuente **150 datos visibles**: 58 de
Letras Euro, 45 de Letras Dólar y 47 de Spiko Euro.

## Lo que no pude comprobar

- Folleto en español
  (<https://cdn.spiko.finance/legal_docs/ES/Prospectus_Spiko_SICAV_ES.pdf>):
  403 a las 20:17:02 UTC. No se reintenta. Usé el inglés y el francés, con
  la misma huella.
- Que Spiko Euro esté dado de alta para venderse en España no se puede
  confirmar en ningún registro público:
  - la CNMV no detalla los fondos de la SICAV;
  - GECO c124199 da `"published":false` (20:18:06 UTC);
  - la base de ESMA da `numFound 0` para «Spiko» (20:21:21 UTC);
  - la web de la gestora no nombra los fondos de Spiko (20:21:22 UTC).
