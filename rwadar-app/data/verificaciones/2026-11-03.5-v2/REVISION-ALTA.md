# Revisión final del alta · Spiko Smart Cash Euro · entrega 2026-11-03.5

Revisor que firma: independiente; no preparé esta entrega. Fecha: 03/11/2026.
Todas las horas son UTC del 03/11/2026.

Uno los resultados de tres revisiones (hechos y fuentes; protección del
inversor y lenguaje; entrega técnica e imagen) y vuelvo a abrir yo mismo las
fuentes que deciden. No reabro la decisión de Víctor de publicar la ficha
aunque no conste en ningún supervisor que el fondo esté notificado para
venderse en España. Lo que reviso es si la ficha lo cuenta con honestidad y
exactitud, sin promesas, y si la entrega es segura.

Solo usé páginas, documentos, API y registros públicos. No inicié sesión, no
hice KYC, no rellené formularios ni conecté wallets. Tampoco sorteé bloqueos.
En el repositorio no modifiqué nada salvo este informe: todas las pruebas las
hice en memoria o en la carpeta temporal de la sesión.

---

## 1. Veredicto: **aprobado con cambios**

La entrega es **segura** y las **cifras son correctas**:

- el 2,84 % es lo que publica Spiko con el valor liquidativo del 02/11/2026;
- el mínimo de 1 €, las comisiones, el corte de las 15:00, el límite del 25 %,
  el riesgo 1 de 7 y el ISIN coinciden con el KID y el folleto;
- el SQL solo añade esta ficha, tiene guarda de la revisión anterior y no
  borra ni cambia nada.

El aviso principal también es honesto: es verdad que ningún registro público
muestra que este fondo esté dado de alta para venderse en España.

**Pero no se puede publicar tal como está.** Hay errores de exactitud que la
decisión de Víctor no cubre:

- tres frases citan o atribuyen mal: la cita «tipo fijo garantizado» no es
  literal, la delegación en Amundi no está en el KID y la frase «No existen
  límites de retirada» sale de una página que no está entre las fuentes;
- la fecha de aprobación por la AMF es en realidad la fecha del certificado;
- faltan textos que la propia entrega dice haber aplicado (revisión del 03/11,
  apartado A.6): «no es una cuenta ni un depósito», «puedes perder parte o
  toda la inversión» y que el fondo no tiene ficha pública en la base de la
  AMF.

Además, la web corta lo que el inversor más necesita ver:

- en la tarjeta, la fila «Salida» se queda en «…15:00 (París) y…» y no se lee
  que el reembolso puede limitarse;
- en la ficha completa, la web enseña como mucho 8 datos y esta ficha tiene
  11, así que desaparecen el reembolso, el riesgo y la cifra fechada.

Ninguno es un dato falso imposible de corregir, ni un riesgo técnico en el
SQL. Por eso el veredicto no es «rechazado». Con los 13 cambios del apartado 4,
y después de regenerar el lote y repetir el ensayo, la ficha puede publicarse.

### Cómo uní las tres revisiones

| Tema | Revisores | Decisión |
|---|---|---|
| Cita «tipo fijo garantizado» (aviso 3 y referencia) | los tres: obligatorio | Obligatorio. Un solo texto, que también recupera lo que pedía A.6 n.º 7. |
| Aviso 6: la delegación en Amundi atribuida al KID | hechos y lenguaje: obligatorio | Obligatorio. Lo comprobé yo: el KID no la menciona. |
| Nota «sin ficha pública en GECO» | hechos: obligatorio; técnica: recomendado | **Obligatorio**, porque la entrega dice que aplicó A.6 y A.6 n.º 4 y n.º 8 lo pedían. Va en la métrica «Supervisor» y en un aviso nuevo. |
| Más de 8 datos en la ficha completa de la web | solo lenguaje | **Obligatorio**. Lo comprobé en el código (`rwadar-20260820.js`, líneas 1928-1939): es la única ficha del lote con más de 8. |
| Fila «Salida» cortada en la tarjeta | solo lenguaje | **Obligatorio**. Lo comprobé pintando la tarjeta con el CSS real. |
| Aviso 2 (España), con jerga | lenguaje: obligatorio | Obligatorio, pero más corto: es lo que Víctor pidió decir «con claridad» y sale en la tarjeta. El consejo de preguntar a la CNMV pasa a la ficha completa (recomendación 2). |
| Título («tipo interbancario») | hechos: recomendado; lenguaje: obligatorio | **Recomendado**. No es falso, solo impreciso. En mi captura con el CSS real no se corta; en la del revisor de lenguaje, sí. |
| Resumen («grandes bancos») | lenguaje: obligatorio | Obligatorio. Ni el KID ni el folleto hablan de «grandes» bancos: el KID dice «una o varias contrapartes». |
| «Acceso desde España» (KYC atribuido a la tabla de países) | lenguaje: recomendado | Recomendado. La referencia ya avisa de que no consta en ningún supervisor. |
| Ajuste del valor liquidativo (swing pricing) | hechos: recomendado | Recomendado. Lo comprobé en el folleto: hasta el 0,50 %. |

---

## 2. Qué se comprobó, con URL y hora

### Fuentes que abrí yo

| Hora UTC | Fuente | Qué dice |
|---|---|---|
| 13:49:49 | https://www.spiko.io/es/spiko-euro (HTTP 200) | «Interés a tipo fijo 2,84% Garantizado por contrapartes Pagado diariamente»; «Spiko Euro recibe a cambio un rendimiento diario garantizado»; «Sociedad gestora Amundi Asset Management»; «Amundi … actúa como gestor delegado»; «BNP Paribas paga €STR + 0,40%»; «Tu dinero siempre accesible · 100% liquidez nocturna». «tipo fijo» sale una sola vez y la frase «tipo fijo garantizado» no aparece. Tampoco está «No existen límites de retirada». El enlace «Verificar la autorización» va a `https://geco.amf-france.org/produit-d-epargne/c124199` y el de la CNMV, a la ficha de Spiko Finance (n.º 5325). |
| 13:49:50 | https://www.spiko.io/es/usos-principales/particulares (200) | «No existen límites de retirada.»; «verifica tu identidad con tu teléfono»; «después de las 15:00 o en días no hábiles llegarán el segundo día hábil (T+2)». |
| 13:49:51 | https://cdn.spiko.finance/legal_docs/ES/KID_eurSAFO_ES.pdf (200; SHA-256 53effea2…, el mismo que el expediente) | «Productor de este producto: TWENTY FIRST CAPITAL». Amundi solo aparece en el nombre del fondo: **el KID no habla de delegación**. «invierte hasta el 120 % de su activo en obligaciones, acciones e instrumentos del mercado monetario»; la rentabilidad de esos títulos «se entrega a la contraparte del TRS», que paga «el indicador de referencia más un margen». «Hemos clasificado este Producto en el indicador de riesgo 1 de 7». «Riesgo(s) significativo(s) para el Producto no tenidos en cuenta en este indicador: Riesgo de contraparte». «Este riesgo podría no ser, en su caso, compensado por las garantías financieras recibidas.» «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión.» «El capital no está garantizado». «Gates». Corte a las 15:00 (París). Plazo recomendado: 3 meses. Escenarios a 3 meses con 10.000 €: 9.980, 9.990, 9.990 (moderado, −0,10 %) y 10.100 €. Reclamaciones «ante la Sociedad Gestora» (www.twentyfirstcapital.com). El €STR «expresa el tipo del mercado monetario del euro a un día». Publicado el 01/09/2026. |
| 13:49:52 | https://geco.amf-france.org/back-office/document/download/438274 (200; SHA-256 940559b4…, el mismo que el expediente), folleto, §3.2.4 | «Délégataire de gestion financière Amundi Asset Management». «Classification AMF Non applicable». Clase «Action EUR FR0014015LD3 … 1 EUR … Tous souscripteurs». Gestión «0,25% TTC»; funcionamiento «0,10% TTC maximum»; suscripción y reembolso «Néant». Corte «15h00 (heure de Paris)»; «le règlement intervient en J+1». Límite: «rachat net toutes parts confondues divisé par l'actif net»; «seuil de 25 % de l'actif net est atteint»; lo no pagado pasa «sur la prochaine date de centralisation»; como mucho «20 valeurs liquidatives sur 3 mois». Swing pricing: «ne pourra excéder 0,50% de la valeur liquidative». |
| 13:49:53 | https://cdn.spiko.finance/legal_docs/EN/SAFO_Letter_EN.pdf (200; SHA-256 709e0585…, el mismo que el expediente) | «Paris, 2026-02-23». La SICAV fue «authorised on the 2024-04-05 under the registry number SCV20240012». «List of subfunds also covered by this certificate: SCV20260075 SPIKO AMUNDI OVERNIGHT SWAP FUND». «managed by the management compagny TWENTY FIRST CAPITAL». **No da la fecha de aprobación del compartimento**: el 23/02/2026 es la fecha del certificado. |
| 13:49:54 | https://geco.amf-france.org/back-office/funds/compartment/c124199 (200) | `{"idInterne":0,…,"published":false}`: **sin ficha pública**. Control: `…/compartment/c79399` (EU T-Bills) sale `published: true` (13:49:54). |
| 13:49:55 | https://public-api.spiko.io/v0/share-classes/eurSAFO/yield (200) | `dailyYield`, `weeklyYield` y `monthlyYield` = «0.0284». `previousYieldTimestamp` = 2026-11-02 18:58:32 UTC (el valor liquidativo del 02/11). `nextYieldTimestamp` = 2026-11-03 19:30 UTC: esta tarde puede cambiar la cifra. |
| 13:49:55 | https://public-api.spiko.io/v0/net-asset-values/eurSAFO?startDay=2026-10-28 (200) | 29/10: 1,016018; 30/10: 1,016251; 02/11: 1,016329. Recalculado: 30/10 → 02/11 (un día de devengo) = **2,841 %**. |
| 13:49:55 | https://public-api.spiko.io/v0/share-classes/eurSAFO (200) | ISIN FR0014015LD3; mínimo «1»; entrada «0»; salida «0»; gestión «0.0025». |
| 13:49:56 | https://docs.spiko.io/documentation/product_overview/fund_availability (200; SHA-256 46152ac3…, el mismo que el expediente) | Columnas «Smart Cash · T-Bills Euro · T-Bills Dollar · T-Bills Pound»; «🇪🇸 Spain ✅ ✅ ✅ ❌»; «Last updated: October 23, 2026»; «A share class created later needs its own registration before it can be distributed there». Es una fuente del emisor. No menciona ni particulares ni KYC. |
| 13:49:56 | https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es (200) | «SPIKO SICAV … 2380 · 30/01/2026 · SICAV · FRANCIA». Solo tiene las pestañas «Datos generales» y «Entidades comercializadoras»: no hay lista de compartimentos. |
| 13:49:57 | https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&vista=17&lang=es (200) | Spiko Finance, n.º 5325, 14/01/2026: «1. Recepción y transmisión de órdenes … 3) Participaciones y…» (instituciones de inversión colectiva). |
| 13:49:59 | https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?lastNObservations=6&format=csvdata (200) | €STR: 26/10 2,441; 27/10 2,440; 28/10 2,439; 29/10 2,439; 30/10 2,440; 02/11 2,441. Cambia cada día; el 2,84 % queda unos 0,40 puntos por encima. |
| 13:51:11 | https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0099567J&lang=es (200), control | 2XIDEAS UCITS (n.º 2036, Luxemburgo): solo «Hechos relevantes», «Datos generales» y «Entidades comercializadoras». «compartimento» no aparece ninguna vez. La CNMV no publica compartimentos. |
| 13:51:13 | https://registers.esma.europa.eu/solr/esma_registers_funds_cbdif/select?q=*Spiko*&wt=json&rows=5 (200) | `numFound` 0. No es concluyente: la base está incompleta para la AMF (revisión del 03/11, A.1). |

### Comprobaciones locales (sin red y sin escribir en el repositorio)

- **SQL** (`aplicar-y-aprobar.sql`, SHA-256 `ea32794a…7065e`, el mismo que
  `pruebas-locales.json`), comprobado entre las 13:51 y las 13:53:
  - empieza con `begin isolation level serializable` y sigue la guarda:
    la publicada tiene que ser `f26bba19…` (o la nueva `ec8dbd52…`), el
    catálogo no puede estar retirado, la fecha no puede ser anterior al
    03/11/2026, y la identidad de la revisión destino se comprueba por hash;
  - tiene 292 inserciones, todas en `rwadar_catalogo` y todas con
    `on conflict … do nothing` (1 revisión, 69 fuentes, 26 plataformas,
    109 plataforma_fuentes, 26 alertas, 36 alerta_fuentes y 25 ofertas);
  - tiene un único `update`, que aprueba la revisión solo si estaba en
    borrador y si los recuentos son 26/25/8/14/3;
  - termina en `commit`;
  - no hay ni `delete`, ni `truncate`, ni `drop`, ni `alter`, ni
    `grant`/`revoke`, ni `create`;
  - comparado con el SQL de 2026-11-03.4, normalizando identificadores, solo
    cambian 5 sentencias: la cabecera, la fila de la revisión, la oferta
    nueva, los recuentos esperados y la referencia de aprobación.
- **Reconstrucción** con `construirSqlImportacion`, en memoria: sale la
  revisión `ec8dbd52-e7ad-3b4a-11c6-d6ed9070820b`, idéntica a `catalogo.sql`.
  La base 2026-11-03.4 vuelve a dar `f26bba19…`.
- **El resto del lote no cambia.** Las 24 fichas, su documentación, las 26
  plataformas y la reventa son idénticas, y en el mismo orden, a las de
  2026-11-03.4. Manifiesto: 26 / 25 / 8-14-3.
- **Tarjeta** (lector real `ficha-editorial-20261022.js`, a las 12:00 UTC del
  03/11):
  - mínimo «1 €»;
  - España «Disponible desde España según la fuente» (estado «si»);
  - salida «Reembolso: Diario: orden antes de las 15:00 (París) y abono al
    día hábil siguiente; puede limitarse si se pide más del 25 % del fondo»;
  - el 11/11 la ficha vence.
- **Tarjeta pintada con el CSS real** (`rwadar-20260820.css`, Chrome sin
  pantalla, 13:54:57). La fila Salida está cortada a 2 líneas: hoy solo se lee
  «Reembolso: Diario: orden antes de las 15:00 (París) y…»; con el cambio 8 se
  lee «Reembolso: Diario; puede limitarse si un día las salidas…». Captura:
  `/tmp/claude-0/-home-user-RWADAR/bcd94329-4aea-5eb8-87b2-dce08ca7c659/scratchpad/firma/render/card-1280-recorte.png`
  (izquierda, la actual; derecha, la propuesta).
- **Ficha completa de la web** (`metricasOfertaLocal`, líneas 1928-1939):
  - corta a 8 datos;
  - como «Rendimiento…» no cuenta como rentabilidad, añade arriba un
    «Rentabilidad publicada 2,84 %» sin fecha;
  - se quedan fuera «Reembolso», «Riesgo KID», «Plazo recomendado» y
    «Rendimiento neto publicado · VL 02/11/2026».

  Es la única ficha del lote con más de 8 datos: Letras del Tesoro Euro tiene 8.
- **Imagen maestra** (`rwadar-editorial-source/ofertas/fotos/spiko-smart-cash-euro.webp`,
  1344×768): calle haussmanniana genérica al amanecer, sin personas, marcas,
  banderas ni texto legible.
- **Compuerta CSP**: ni la ficha ni la documentación propuestas contienen
  `<style`, `style=`, `on…=` ni `<script`.
- **Los textos propuestos funcionan con los lectores reales.** Los probé en
  memoria
  (`/tmp/claude-0/-home-user-RWADAR/bcd94329-4aea-5eb8-87b2-dce08ca7c659/scratchpad/firma/sim/propuesta.cjs`):
  - la fila España sigue en «si» y el mínimo en «1 €»;
  - la fila Salida empieza por «Reembolso: Diario; puede limitarse…»;
  - la web enseña los 8 datos, con la cifra fechada;
  - cada referencia cita una fuente que está en la lista;
  - el 11/11 vence;
  - pasan las aserciones nuevas del ensayo.

### Lo que comprobaron los otros revisores y yo no repetí

- La CNMV no tiene advertencias sobre Spiko: «No hay datos disponibles»
  (https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=Spiko, 13:35:30,
  revisor de hechos).
- La comercializadora inscrita de la SICAV es «ALDANA CAPITAL, SOCIEDAD
  ANONIMA AGENCIA DE VALORES» (pestaña `&vista=18`, 13:29:56, revisor de
  hechos).
- España no está entre los países excluidos del alta
  (https://docs.spiko.io/documentation/product_overview/onboarding_restrictions,
  13:30:25, revisor de lenguaje).
- El ensayo PGlite `comprobar-entrega.mjs` dio «resultado: correcto» a las
  13:39:35 (revisor técnico). Ese ensayo reescribe `pruebas-locales.json`; el
  revisor lo restauró y el árbol estaba limpio cuando empecé.
- Ejecutar `preparar-entrega.mjs` sobre una copia temporal da los 8 archivos
  idénticos byte a byte (revisor técnico, 13:42).
- La imagen de tarjeta generada (960×660) y los recortes 16:10 y 2:1 se
  pueden leer bien (revisor técnico, 13:41).

---

## 3. Lo que no se pudo comprobar

- **Si el compartimento (clase FR0014015LD3, SCV20260075) está de verdad
  notificado para venderse en España.** No hay forma pública de verlo: la
  CNMV no publica compartimentos, GECO no tiene ficha de este y la base de
  ESMA está incompleta. Solo lo cerraría un escrito de la CNMV o de la AMF, o
  la documentación de la comercializadora inscrita (Aldana Capital A.V.). Esta
  es la duda que Víctor decidió publicar con aviso.
- **El folleto en español**
  (https://cdn.spiko.finance/legal_docs/ES/Prospectus_Spiko_SICAV_ES.pdf)
  daba 403 a las 13:28:54 (revisor de hechos) y no lo volví a pedir. Usé el
  folleto francés que publica la AMF en GECO.
- **Si Spiko acepta de verdad el alta de un particular residente en España.**
  No inicié sesión ni hice KYC.
- **Si el límite del 25 % o el ajuste del valor liquidativo se han activado
  alguna vez.** No hay fuente pública.
- **La cifra de esta tarde.** La API de Spiko recalcula a las 19:30 UTC de
  hoy, y el 2,84 % puede cambiar. La ficha lo fecha bien («02/11/2026»).
- **El ensayo PGlite no lo ejecuté yo**, porque escribe en el repositorio. En
  su lugar reconstruí el SQL en memoria y comparé hashes. Tras los cambios
  hay que volver a ejecutarlo (cambio 13).
- **Las capturas son una aproximación.** Las hice con una tarjeta montada a
  mano con el CSS real, no con la web publicada ni con la app en un móvil.
  Las fuentes tipográficas pueden variar, y por eso no sé con seguridad si el
  título se corta: en mi captura no, en la del revisor de lenguaje sí.
- **Pasos de publicación que aún no existen**, y por tanto no pude comprobar:
  - la página `ofertas/spiko-smart-cash-euro.html` y su ruta en
    `rwadar-fichas-manifiesto.js`;
  - la imagen de tarjeta publicada en su URL canónica;
  - la aprobación en `estado.json`.
- **Que la publicada en Supabase siga siendo `f26bba19…`** cuando se aplique
  el SQL. No toqué Supabase; la guarda del SQL lo exige.

---

## 4. Cambios obligatorios

Todos van en
`rwadar-app/data/verificaciones/2026-11-03.5-v2/preparar-entrega.mjs`, salvo
el 13. Los números de línea son los de la versión actual.

**1. Aviso n.º 2** (`avisos[1]`, línea 86; es el que sale en la tarjeta como
«Revisa»). Sustituir por:

> Spiko dice que se puede contratar desde España, pero no hemos podido confirmar en ningún registro público de la CNMV ni de la AMF (Francia) que este fondo esté dado de alta para venderse aquí: la CNMV solo muestra la sociedad Spiko SICAV, no sus fondos uno a uno.

Motivo: dice lo mismo, pero sin la jerga «compartimentos» ni «notificado», y
nombra los registros que se miraron (CNMV 13:49:56 y 13:51:11; GECO 13:49:54).
Es el aviso que Víctor pidió dar «con claridad».

**2. Aviso n.º 3** (`avisos[2]`, línea 87). Sustituir por:

> No es una cuenta ni un depósito. La web de Spiko dice «Interés a tipo fijo» y «Garantizado por contrapartes», pero el KID dice que no hay rentabilidad mínima garantizada y que puedes perder parte o toda la inversión: el rendimiento depende del €STR, que cambia cada día.

Motivo: la web no dice «tipo fijo garantizado». Dice «Interés a tipo fijo» y
«Garantizado por contrapartes» (13:49:49), y una cita entre comillas tiene que
ser literal. Además, recupera lo que pedía A.6 n.º 7.

**3. Aviso n.º 4** (`avisos[3]`, línea 88). Sustituir por:

> No es un fondo monetario: invierte en acciones, bonos y otros títulos y cede lo que rinden a uno o varios bancos, que a cambio le pagan el €STR más un margen. Si un banco falla, el fondo podría quedar expuesto a esos títulos, que pueden bajar, y las garantías podrían no cubrir la pérdida. El riesgo 1 de 7 del KID no tiene en cuenta este riesgo.

Motivo: el texto actual no dice qué hay en «su cartera» y llama «interés» al
pago de la permuta. El KID dice: invierte en «obligaciones, acciones e
instrumentos del mercado monetario»; el fondo «podría verse expuesto al riesgo
de los valores en cartera»; el riesgo «podría no ser … compensado por las
garantías»; y el riesgo de contraparte va «no tenido[s] en cuenta en este
indicador» (13:49:51).

**4. Aviso n.º 5** (`avisos[4]`, línea 89). Sustituir por:

> Si un mismo día los inversores piden sacar, entre todos y descontado lo que entra, el 25 % del fondo o más, la gestora puede pagar solo una parte y pasar el resto al siguiente día hábil (como mucho 20 días en 3 meses), aunque la página de Spiko para particulares diga «No existen límites de retirada».

Motivo: la frase «No existen límites de retirada» está en la página
«Particulares» (13:49:50), no en la de Spiko Euro (13:49:49). El folleto habla
de reembolsos netos sobre el activo neto, con umbral del 25 % «atteint»; lo no
pagado pasa a la siguiente fecha, y el límite dura como mucho 20 valores
liquidativos en 3 meses (13:49:52).

**5. Aviso n.º 6** (`avisos[5]`, línea 90). Sustituir por:

> La web de Spiko presenta a Amundi Asset Management como «Sociedad gestora», pero la gestora es Twenty First Capital, según el KID y el certificado de la AMF; el folleto dice que delega en Amundi la gestión de las inversiones. Las reclamaciones se dirigen a Twenty First Capital.

Motivo: el KID no menciona la delegación en Amundi; solo nombra a Twenty
First Capital como productor y manda las reclamaciones a la sociedad gestora
(13:49:51). La delegación está en el folleto: «Délégataire de gestion
financière Amundi Asset Management» (13:49:52). El certificado dice «managed
by … TWENTY FIRST CAPITAL» (13:49:53).

**6. Aviso nuevo n.º 7**: añadir al final de `avisos`, con
`aviso('…')`. Va el último para no mover los índices que comprueba el ensayo.

> El enlace de la web de Spiko para «Verificar la autorización» lleva a la base pública de la AMF (GECO), pero allí este fondo todavía no tiene ficha publicada. Su autorización consta en el folleto que publica la AMF y en un certificado de la AMF que aloja Spiko.

Motivo: A.6 n.º 8 pedía mantener este aviso, y la entrega dice que aplicó A.6.
GECO responde `published:false` para c124199 (13:49:54), que es justo el
destino del enlace de la web (13:49:49).

**7. Métricas** (`metricas`, líneas 71-83). Sustituir la lista de 11 por estas
8, en este orden:

1. `{ etiqueta: 'Mínimo', valor: '1 EUR' }`
2. `{ etiqueta: 'Qué es', valor: 'Fondo de inversión europeo (UCITS) que invierte en acciones, bonos y otros títulos y cambia lo que rinden con bancos por el €STR más un margen; no es un fondo monetario' }`
3. `{ etiqueta: 'Supervisor', valor: 'AMF (Francia): n.º SCV20260075, aún sin ficha pública en su base GECO · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra qué fondos de la SICAV están dados de alta en España' }`
4. `{ etiqueta: 'Gestora', valor: 'Twenty First Capital (gestión de las inversiones delegada en Amundi)' }`
5. `{ etiqueta: 'Comisiones', valor: '0,25 % anual de gestión y hasta 0,10 % de gastos de funcionamiento; 0 % de entrada y de salida' }`
6. `{ etiqueta: 'Reembolso', valor: 'Diario; puede limitarse si un día las salidas netas llegan al 25 % del fondo. Orden antes de las 15:00 (hora de París) y pago al día hábil siguiente' }`
7. `{ etiqueta: 'Riesgo KID', valor: '1 de 7, sin contar el riesgo de contraparte (el KID lo deja fuera); plazo recomendado: 3 meses' }`
8. `{ etiqueta: 'Rentabilidad publicada · neta y variable · 02/11/2026', valor: PCT }`

Motivo:

- La web enseña como mucho 8 datos, y con 11 se pierden el reembolso, el
  riesgo, el plazo y la cifra fechada.
- La etiqueta «Rentabilidad publicada · …» evita que la web añada una
  rentabilidad sin fecha. Es la misma forma que en Letras del Tesoro.
- La métrica «Supervisor» recupera «sin ficha pública en GECO», que pedía A.6
  n.º 4.

Comprobado en memoria con el código real: se ven los 8 datos.

**8. Referencia «Reembolso»** (`documentacion.referencias`, línea 114; es la
fila «Salida» de la tarjeta). Sustituir el valor por:

> Diario; puede limitarse si un día las salidas netas de todos los inversores llegan al 25 % del fondo. Orden antes de las 15:00 (hora de París) y pago al día hábil siguiente

Motivo: la tarjeta corta la fila a 2 líneas. Hoy no se ve que el reembolso
puede limitarse; con este texto, sí (captura de las 13:54:57). Además, «si se
pide más del 25 % del fondo» puede entenderse como el 25 % de lo tuyo.

**9. Referencia «Web frente al KID»** (línea 123). Sustituir el valor por:

> La web dice «Interés a tipo fijo», «Garantizado por contrapartes» y «rendimiento diario garantizado»; el KID dice «No existe rentabilidad mínima garantizada. Podría perder la totalidad o parte de su inversión»

Motivo: es la misma cita inexacta del aviso n.º 3, ahora en la ficha completa.
Este texto usa las palabras literales de la web (13:49:49) y del KID
(13:49:51).

**10. Resumen** (`resumen`, líneas 63-64; la descripción empieza con él).
Sustituir por:

> Fondo de inversión UCITS en euros de Spiko que busca el €STR (el tipo a un día del euro) más un margen mediante permutas (swaps) con bancos; no es un fondo monetario ni un depósito. Su valor cambia cada día y el capital no está garantizado.

Motivo: el KID solo dice «una o varias contrapartes», y ni el KID ni el
folleto hablan de «grandes bancos». Repetir ese tono comercial de Spiko («los
bancos más confiables del mundo») es una promesa implícita. Además, quita la
jerga «valor liquidativo variable».

**11. Descripción** (`documentacion.descripcion`, líneas 97-100): la parte que
va detrás de `${oferta.resumen} `. Sustituir por:

> Qué se adquiere: acciones de la clase EUR (FR0014015LD3) del compartimento Spiko Amundi Overnight Swap Fund, de Spiko SICAV (Francia), autorizado por la AMF con el n.º SCV20260075 (así figura en un certificado de la AMF del 23/02/2026). El fondo invierte en acciones, bonos y otros títulos y cede lo que rinden a uno o varios bancos, que a cambio le pagan el €STR más un margen; el rendimiento es variable y, si un banco falla, el fondo puede quedar expuesto a esos títulos. Spiko marca España como disponible, pero ni la CNMV ni la AMF publican que este fondo esté dado de alta para venderse en España.

Motivo: el certificado está fechado el 23/02/2026, pero no dice cuándo se
aprobó el compartimento (13:49:53), así que «aprobado por la AMF el
23/02/2026» es inexacto. Además, en estas permutas el fondo no intercambia su
cartera: se la queda y cede su rendimiento (KID).

**12. Fuente nueva «Particulares».** En el objeto `F` (líneas 43-52), añadir
justo después de `disponibilidad`:

```js
  particulares: 'https://www.spiko.io/es/usos-principales/particulares',
```

En `oferta.fuentesActuales` (línea 92), añadir `F.particulares` justo detrás
de `F.disponibilidad`.

Motivo: es la fuente del aviso n.º 5 («No existen límites de retirada»,
13:49:50). Sin ella, la ficha cita una frase que no está entre sus fuentes.
`documentacion.fuentes` la recoge solo, porque se construye con
`Object.values(F)`.

**13. Regenerar y repetir el ensayo.**

En `comprobar-entrega.mjs`:

- línea 92: `assert.match(o.avisos[1].texto, /no hemos podido confirmar en ningún registro público/);`
- línea 93: `assert.match(o.avisos[2].texto, /Interés a tipo fijo/);`
- añadir: `assert.ok(o.metricas.length <= 8, 'Smart Cash: la web enseña como mucho 8 datos');`
- añadir: `assert.equal(o.avisos.length, 7, 'Smart Cash: 7 avisos');`

En `preparar-entrega.mjs`, en `cambiosAplicados` (líneas 154-156), sustituir
`'métrica fechada «· VL 02/11/2026»'` por
`'métrica fechada «Rentabilidad publicada · neta y variable · 02/11/2026»; 8 datos'`,
y añadir:

```js
'no es una cuenta ni un depósito; puedes perder parte o toda la inversión',
'sin ficha pública en GECO (métrica y aviso)',
'citas literales de la web',
'fila Salida: la limitación primero',
```

Después:

1. ejecutar `node rwadar-app/data/verificaciones/2026-11-03.5-v2/preparar-entrega.mjs`,
   que da un `revisionId`, un hash y un SQL nuevos;
2. ejecutar `node rwadar-app/data/verificaciones/2026-11-03.5-v2/comprobar-entrega.mjs`,
   que debe dar «resultado: correcto»;
3. comprobar que, frente a esta versión, solo cambia la ficha
   `spiko-smart-cash-euro`.

Motivo: con los textos nuevos, el ensayo actual falla. Además, cambian la
identidad de la revisión y el SQL, y lo que se aplique en Supabase tiene que
ser lo regenerado y probado.

---

## 5. Recomendaciones

No impiden publicar, pero conviene hacerlas en la misma regeneración, porque
ya hay que rehacer el SQL.

1. **Título** (línea 60) **e `imagenAlt`** (línea 66). Título: «Spiko Euro
   (Smart Cash): fondo en euros ligado al €STR». En `imagenAlt`, mejor
   describir la ilustración que repetir el título, por ejemplo: «Calle
   parisina al amanecer; ilustración editorial genérica». «Tipo interbancario»
   le suena a un particular a Euríbor, mientras que el KID define el €STR como
   «el tipo del mercado monetario del euro a un día».
2. **Referencia «Acceso desde España»** (líneas 112-113).
   - Valor: «Disponible en España según la tabla de países de Spiko
     (23/10/2026); ningún registro público de la CNMV ni de la AMF muestra que
     este fondo esté dado de alta aquí».
   - Alcance: «Tabla de países de Spiko, que es una fuente del propio emisor.
     La CNMV solo muestra la sociedad Spiko SICAV (n.º 2380), no sus fondos
     uno a uno; si quieres confirmarlo, puedes preguntar a la CNMV.»

   Motivo: la tabla citada no habla ni de particulares ni de KYC (13:49:56).
   Comprobado con el lector real: la fila España sigue en «si».
3. **`rentabilidad.literal`** (líneas 69-70): «Cifra que publica Spiko, ya
   descontadas sus comisiones: lo que creció el fondo en su último día de
   cálculo, pasado a un año (valor liquidativo del 02/11/2026; consultado el
   03/11/2026). Variable: sigue al €STR; no es un tipo fijo ni está
   garantizado.» Quita jerga («devengo diario», «anualizado») y mantiene la
   frase que comprueba el ensayo.
4. **Referencia «Riesgo (KID)»** (línea 120): «1 de 7, sin contar el riesgo de
   contraparte; capital no garantizado y sin rentabilidad mínima; en los
   escenarios del KID, 10.000 € quedan entre 9.980 € y 10.100 € a 3 meses
   (moderado: 9.990 €); plazo recomendado de 3 meses». Ayuda a no confundir el
   2,84 % con una ganancia segura.
5. **Referencia nueva**:
   `R('Ajuste del valor liquidativo', 'Si un día entran o salen muchas órdenes, la gestora puede ajustar el valor liquidativo hasta un 0,50 % (swing pricing)', F.folleto, '2026-09-01', 'Folleto de la SICAV (§3.2.4) en la base GECO de la AMF.')`.
   Lo comprobé en el folleto (13:49:52). La etiqueta no lleva «reembolso»,
   «salida», «plazo», «comisión» ni «gastos», para que la tarjeta no la tome
   como dato de salida ni de costes.
6. **Características** (líneas 104 y 107):
   - «Qué se adquiere»: «Acciones de un fondo UCITS que invierte en acciones,
     bonos y otros títulos y cambia lo que rinden con bancos por el €STR más
     un margen». «Obtiene» suena a resultado asegurado.
   - «Entidad que comercializa»: «Spiko Finance, empresa de inversión de otro
     país del EEE inscrita en la CNMV (n.º 5325) para recibir y transmitir
     órdenes sobre fondos; en la CNMV, la comercializadora inscrita de la
     SICAV es Aldana Capital A.V.»
7. **Imagen** (`rwadar-editorial-source/ofertas/fichas.json`):
   - paso 3: «Reembolso diario» → «Pides el reembolso», porque el reembolso
     puede limitarse;
   - `concepto`: «un fondo en euros ligado al €STR, representado por una calle
     financiera parisina genérica», para que coincida con la foto.
8. **Fuera de este lote**: Spiko Letras del Tesoro Euro, ya publicada, tiene el
   mismo corte en la fila Salida. Hoy no se ve «puede limitarse si se pide más
   del 10 % del fondo». En el próximo ciclo, poner primero la limitación.
9. **Pasos de publicación** (CICLO-DIARIO §4, igual que con Kraken):
   1. añadir `ofertas/spiko-smart-cash-euro.html` a `rwadar-fichas-manifiesto.js`;
   2. generar la imagen de tarjeta y su aprobación en `estado.json`;
   3. publicar la imagen y comprobarla en su URL canónica (GET 200, WebP,
      bytes y SHA) **antes** de ejecutar `aplicar-y-aprobar.sql`.

   Si al aplicar ya no está publicada `f26bba19…`, la guarda parará el SQL:
   habrá que regenerar sobre la nueva base.
10. **Cifra de esta tarde.** Si se publica después de las 19:30 UTC, el 2,84 %
    sigue siendo correcto con su fecha (02/11/2026). No hay que cambiar la
    fecha sin cambiar también la cifra.
11. **Cerrar la duda de España.** Pedir por escrito a la CNMV (o a Aldana
    Capital A.V.) si FR0014015LD3 / SCV20260075 está notificado. Si se
    confirma, el aviso n.º 2 puede cambiar; si la respuesta es negativa, hay
    que retirar la ficha.
