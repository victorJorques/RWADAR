# Revisión independiente · grupo spiko · 21/11/2026

Revisor independiente (no preparé estos expedientes). Abrí yo mismo las fuentes
entre las **18:03 y las 18:15 UTC** del sábado 21/11/2026, sin iniciar sesión
ni hacer KYC. Copias en `fuentes/spiko/` (los crudos en `fuentes/spiko/crudo/`,
fuera de Git) y huellas en `fuentes/spiko/inventario-revision.json`.

**Veredicto global: aprobado con cambios.** Las tres cifras y el cambio crítico
(Spiko Euro: España de «Sí» a «Sin confirmar») se sostienen con las fuentes de
hoy. Hay que corregir un texto de España en las dos fichas de Letras del Tesoro
y recortar dos nombres de personas que siguen en una copia del grupo.

| Ficha | Decisión del investigador | Mi veredicto |
|---|---|---|
| spiko-letras-del-tesoro-euro | actualizar (solo textos) | confirmado con cambios |
| spiko-letras-del-tesoro-dolar | mantener | confirmado con cambios (si se adopta el texto nuevo de España) |
| spiko-smart-cash-euro | actualizar (España: Sin confirmar) | confirmado con cambios |

---

## 1. Las cifras, abiertas hoy en la API pública de Spiko

Todas las huellas coinciden con las del vigía (17:36–17:37 UTC) y con las del
investigador. Hoy es sábado: no hay valor liquidativo (VL) nuevo.

| Fuente (public-api.spiko.io/v0/…) | Hora UTC | Literal | SHA-256 |
|---|---|---|---|
| share-classes/EUTBL/yield | 18:03:18 | `"monthlyYield":"0.0245"`, `updatedAt 2026-11-20T17:18:23Z` | 02a03185… = vigía |
| net-asset-values/EUTBL/latest | 18:03:18 | `"day":"2026-11-22…","value":"1.063496"`, `updatedAt 2026-11-20T17:18:23Z` | 98a9113d… = vigía |
| share-classes/USTBL/yield | 18:03:19 | `"monthlyYield":"0.04"` | 859689c2… = vigía |
| net-asset-values/USTBL/latest | 18:03:19 | `"day":"2026-11-20…","value":"1.103573"` | 6591d431… = vigía |
| share-classes/eurSAFO/yield | 18:03:20 | `"dailyYield":"0.0284"`, `previousYieldTimestamp 1795192657` (20/11 16:37 UTC) | cambia solo `updatedAt`, que es la hora de la consulta |
| net-asset-values/eurSAFO/latest | 18:03:20 | `"day":"2026-11-20…","value":"1.017886"` | 9b7f7866… = vigía |

Recalculado por mí con la serie de VL (`?startDay=2026-09-20`, 18:03:21–22 UTC),
capitalizando:

- **Letras Euro:** 1,06131 (fechada 22/10) → 1,063496 (fechada 22/11), 31 días:
  **2,452 %**. Cuadra con el 2,45 %.
- **Letras Dólar:** 1,099901 $ (20/10) → 1,103573 $ (20/11), 31 días: **4,002 %**.
- **Spiko Euro:** 1,01734 (13/11) → 1,017886 (20/11), 7 días: **2,837 %**;
  35 días (16/10 → 20/11): **2,834 %**.

La fecha «22/11» de Letras Euro: en la serie, la VL del viernes lleva fecha de
domingo y se calcula el viernes (`2026-11-22` con `updatedAt 2026-11-20T17:18Z`;
igual `2026-11-15` con `updatedAt 2026-11-13` y `2026-11-08` con `2026-11-06`).
El «cambia» del vigía era falsa alarma: es la misma VL que ya está publicada.
**Confirmo** quitar «22/11/2026» del literal de la rentabilidad: hoy esa fecha
está en el futuro y confunde. El literal nuevo («…con el valor liquidativo
calculado el viernes 20/11/2026; consultado el 21/11/2026…») es exacto.

Próximas VL: `nextYieldTimestamp` 1795456800 (lunes 23/11, 18:00 UTC) para las
Letras y 1795462200 (23/11, 19:30 UTC) para Spiko Euro. Si la entrega se aplica
después, hay que volver a leer la API.

## 2. Cambio crítico: Spiko Euro, España de «Sí» a «Sin confirmar»

Intenté rebatirlo buscando cualquier registro público que confirme el fondo en
España. No lo encontré. **Confirmado.**

- **Spiko lo afirma.** docs.spiko.io «Fund Availability» (18:05:30 UTC, mismo
  SHA-256 que el investigador, 179ef546…): «🇪🇸 Spain ✅ ✅ ✅ ❌» y «The Smart
  Cash column covers all four share classes: Spiko Euro…», «Last updated:
  November 13, 2026». La misma página: «A share class created later needs its
  own registration before it can be distributed there».
- **El fondo es posterior a la inscripción en la CNMV.** CNMV, IIC extranjeras
  (18:03:51 UTC): «SPIKO SICAV · 2380 · 30/01/2026 · SICAV · FRANCIA». API de
  Spiko /funds (18:14:38 UTC): SAFO `launchDay 2026-03-01`; certificado de la
  AMF (huella 709e0585… = vigía, 18:10:33 UTC): «Paris, 2026-02-23», con
  SCV20260075 para SPIKO AMUNDI OVERNIGHT SWAP FUND. Por la propia regla de
  Spiko, necesita su propio registro, y nadie publica que lo tenga.
- **La CNMV no publica compartimentos de ninguna SICAV extranjera.** La ficha de
  SPIKO SICAV solo tiene «Datos generales» y «Entidades comercializadoras»
  (vista 18, 18:04:23: «ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA DE VALORES»).
  Control: LAZARD FUNDS (n.º 1991, 18:04:22) tampoco enseña sus fondos. Probé
  las vistas 1 a 20 y solo existen la 0 y la 18 (las demás redirigen a
  error.aspx). El «Listado completo de UCITS» (18:05:14) solo lista nombres de
  SICAV. Hechos relevantes de la SICAV (18:13:18): «No se han encontrado datos
  disponibles». Así que la CNMV no puede confirmar ni negar este fondo.
- **La AMF no enseña el fondo.** API GECO `compartment/c124199` (18:06:29):
  `{"idInterne":0,…,"published":false}`; `/shares`: `[]`; `lastVl/FR0014015LD3`:
  vacío. Ficha con navegador (18:07:44): «OPC :» vacío y «Aucune part
  disponible». Buscador de GECO con navegador: «spiko» (18:08:19) da 4 fondos
  (EU, UK y US T-Bills y un fondo dedicado), no este; «FR0014015LD3» (18:08:28):
  «Aucun produit disponible». La API de búsqueda **sí funciona con curl** si se
  manda el cuerpo que usa el navegador (`sortField`, `multiSortMeta`…): 18:08:38,
  mismos 4 fondos; «SCV20260075», 0. El 13/11 la ficha sí salía («Statut :
  Vivant», expediente del 13/11), así que «desde el 20/11/2026» en «Supervisor»
  es correcto.
- **ESMA no sirve para decidir.** Base de comercialización transfronteriza
  (18:11:52 y 18:12:24): 0 resultados para «Spiko» y «SPIKO». Tiene fondos de
  Twenty First Capital y de Lazard, pero ningún fondo de Spiko, tampoco los de
  Letras, que la CNMV sí tiene inscritos. No confirma ni niega.
- **La gestora no dice nada.** twentyfirstcapital.com/fonds (render 18:12:15):
  no enseña fondos de Spiko; su aviso: «destinée aux résidents français».
- **Hecho nuevo, que el expediente no recoge:** la web de Spiko Euro (render
  18:07:14) enseña «Registrado | Comisión Nacional del Mercado de Valores (CNMV)
  | Verificar la autorización», y ese enlace lleva a la ficha de **Spiko
  Finance** como ESI (n.º 5325), no a la del fondo. Tampoco prueba que el fondo
  esté dado de alta en España, así que refuerza el «Sin confirmar».

Nadie niega que se pueda contratar: Spiko Finance está inscrita en la CNMV para
recibir órdenes sobre IIC (18:11:52: «1. Recepción y transmisión de órdenes… 3)
Participaciones y acciones en instituciones de inversión colectiva»), España no
está en «Onboarding Restrictions» (18:05:31, mismo SHA-256) y la web sigue con
«Crea tu cuenta». Por eso es correcto **no** proponer «No» ni retirar.

Texto de la tarjeta propuesto: «Sin confirmar: Spiko lo ofrece a residentes en
España, pero ni la CNMV ni la AMF muestran este fondo.» (101 caracteres, llano,
respaldado). **Vale.** «Supervisor», con solo la fecha cambiada, también vale.

## 3. Letras del Tesoro Euro y Dólar: España «Sí» se sostiene, el texto no del todo

El «Sí» se sostiene: SICAV inscrita en la CNMV desde el 30/01/2026; los dos
compartimentos son de 2024 (GECO, 18:06:32: `cmpDateCreation 2024-02-21`,
«Statut : Vivant», «Tous souscripteurs»; la clase EUR no cubierta del Dólar es
del 26/08/2024); la regla de Spiko («When a fund is first registered in a
country, all its existing share classes are covered»); Spiko Finance inscrita
(n.º 5325), y la tabla de Spiko marca España.

**Pero el texto propuesto dice «el fondo está inscrito en la CNMV», y la CNMV
no lo muestra.** Muestra la SICAV, como cualquier SICAV extranjera (control
LAZARD FUNDS). La propia ficha lo dice en «Supervisor» («la CNMV no detalla sus
fondos uno a uno»), y la tarjeta de Spiko Euro da como motivo del «Sin
confirmar» que la CNMV no muestra el fondo. Leídas juntas, se contradicen: la
CNMV muestra Letras Euro lo mismo que Spiko Euro, es decir, nada. Hay que decir
que la inscrita es la SICAV (ver correcciones). Además, «KYC» no es castellano
llano: lo publicado decía «verificación de identidad».

Resto de Letras Euro (comprobado hoy): GECO c79399 «Statut : Vivant»,
«SCV20240014», «Dernière valeur liquidative connue au 19/11/2026 : 1.06328 €»
(18:07:49); web ES «2,45% Rendimiento neto actual», «Depósito inicial mínimo
€1», «Sociedad gestora | Twenty First Capital», «Crea tu cuenta» (18:07:22).
KID ES: «11:30 (hora de París)», «último valor liquidativo conocido», «dirigido
a todo tipo de inversores» (huella cb1a621d… = vigía, 18:10:32). Salida de la
tarjeta (115 caracteres) sin cambios: vale.

## 4. Ficha «sin cambios»: Letras del Tesoro Dólar (y lo que no cambia en las otras dos)

Confirmo **mantener** con las fuentes de hoy: 4,00 % en USD (recalculado
4,002 %), VL 1,103573 $ del 20/11; GECO c79398 «Vivant», «SCV20240013»
(18:07:56); web ES «4,00%», «Depósito inicial mínimo $1» (18:07:29); KID ES con
huella c1ce5400… = vigía (18:10:33). Siguen los tres conflictos avisados: API
`eurUSTBL minimumInitialSubscription "1000"` frente a 1 EUR del folleto
(18:14:38); API `USTBL executionMethod "unknownNAVs"` frente al «último valor
liquidativo conocido» del KID ES; y la web «sin preaviso y sin límite de
importe» (HTML, 18:08:59) frente al límite del 10 % del folleto (GECO 438274:
«seuil de 10 % de l'actif net»).

Pero su `propuestaTarjeta` cambia el texto de España («Sí: el fondo está
inscrito en la CNMV…»). Si se adopta, ya no es «mantener», sino «actualizar»
(no crítico), y con la misma corrección que Letras Euro.

En Spiko Euro también comprobé lo que no cambia: web ES (18:07:14) «Interés a
tipo fijo 2,84% Garantizado por contrapartes», «Sociedad gestora | Amundi Asset
Management» y «Amundi… actúa como gestor delegado»; página «Particulares»
(HTML, 18:08:58) «No existen límites de retirada»; KID ES (53effea2… = vigía):
«15:00 (hora de París)», «Riesgo de contraparte», «Productor de este producto:
TWENTY FIRST CAPITAL»; folleto GECO (940559b4… = vigía): «seuil de 25 % de
l'actif net» y «le règlement intervient en J+1». Los seis avisos siguen
vigentes. Salida de la tarjeta (116 caracteres): vale.

## 5. Lo re-fechado con el vigía (muestreo)

Todo lo marcado `segunVigia` en los tres expedientes está en `vigia.json` como
«no cambia» y con el mismo SHA-256; nada viene de un «cambia» ni de un «no se
pudo leer». Lo abrí yo (más de dos por ficha):

| Documento o búsqueda | Hora UTC | SHA-256 de hoy | ¿= vigía? |
|---|---|---|---|
| KID_EUTBL_ES.pdf | 18:10:32 | cb1a621d8bd2… | sí |
| KID_eurSAFO_ES.pdf | 18:10:32 | 53effea21c5f… | sí |
| KID_USTBL_ES.pdf | 18:10:33 | c1ce5400bf18… | sí |
| SAFO_Letter_EN.pdf | 18:10:33 | 709e0585259a… | sí |
| Prospectus_Spiko_SICAV_EN.pdf | 18:10:34 | 7457e79f2853… | sí |
| Terms_of_Use_EN.pdf | 18:10:35 | 71dd7ba10600… | sí |
| Folleto GECO 438274 | 18:10:36 | 940559b4976a… | sí |
| CNMV advertencias «Spiko», «Twenty First Capital», «Amundi», «Aldana» | 18:11:10–16 | distinto byte a byte por el `__VIEWSTATE` de la página | mismo resultado: «No hay datos disponibles.» en los cuatro, igual que la captura del vigía; control «Trading»: «Página 1 de 16» |

El folleto en español sigue dando **403** (18:10:37 UTC).

## 6. Datos personales en las copias del grupo: falta recortar

El resumen dice que se recortó «el nombre de una persona que aparece en un
testimonio». En la copia `grupos/spiko/fuentes/crudo/spiko-web-es-particulares.html`
quedan:

- **dos nombres y apellidos más** de otros dos testimonios, sin recortar;
- el nombre recortado, que sigue en el **nombre de archivo de su foto**
  (`/media/…_<nombre>-<apellido>-….webp`), y lo mismo en las fotos de los otros
  dos testimonios.

`fuentes/spiko-web-es-particulares-render.json` está bien (solo sale un
testimonio y está recortado). Las otras copias HTML y JSON del grupo no tienen
nombres de personas. El folleto en francés guardado en `fuentes/crudo/pdf/`
lista el consejo de administración de la SICAV: es el documento oficial sin
tocar y está fuera de Git, pero no debe subir nunca al sitio.

En mis copias recorté los tres nombres y los nombres de archivo de las fotos.
La huella del original sin recortar está en mi inventario.

---

## Correcciones obligatorias

1. **Letras Euro (y Letras Dólar si se cambia su texto):** en
   `resumenTarjeta.accesoEspana`, no decir «el fondo está inscrito en la CNMV».
   Propuesta (115 caracteres; sirve también como referencia «Acceso desde
   España» porque empieza por «Disponible» y la tarjeta seguirá diciendo
   «España: Sí»): **«Disponible para residentes en España tras el alta y la
   verificación de identidad; la SICAV está inscrita en la CNMV»**. Otra válida:
   «Sí: Spiko SICAV, la sociedad del fondo, está inscrita en la CNMV; Spiko
   admite a residentes en España tras el alta.» (115).
2. **Letras Dólar:** si se adopta el texto nuevo de España, la decisión pasa
   de «mantener» a «actualizar» (no crítico). Si no, que su `propuestaTarjeta`
   conserve el texto publicado, para que el motor no lo tome por un cambio.
3. **Copias del grupo:** recortar en
   `grupos/spiko/fuentes/crudo/spiko-web-es-particulares.html` los dos nombres
   que quedan y los tres nombres de archivo de las fotos de los testimonios, y
   corregir la nota del resumen («he recortado el nombre de una persona»).

## Recomendaciones (no bloquean)

- **Spiko Euro:** el texto de la tarjeta (101 caracteres) y el de la referencia
  (142) son distintos. El motor de la entrega compara los dos: que sean el
  mismo o que se declare la diferencia en `decisiones.json`. Si se unifican,
  vale «Sin confirmar: Spiko lo ofrece en España, pero ningún registro público
  muestra que este fondo esté dado de alta aquí.» (117), que además no da a
  entender que la CNMV enseñe los demás fondos.
- **Spiko Euro, al montar la entrega:** con «Sin confirmar» en la referencia y
  `disponibleEs: true`, la lista dice «España: Sin confirmar», pero
  `ficha-editorial.js` pone en la ficha su texto por defecto, «Sin comprobar si
  se puede contratar desde España» (en inglés, «Not checked…»). Y sí se ha
  comprobado: dos días seguidos. Que el revisor de contenido de la entrega mire
  cómo queda la ficha. El porqué lo sigue dando el aviso publicado sobre la
  CNMV y la AMF, que debe quedarse. El coordinador decide qué hacer con
  `disponibleEs`.
- **Expediente de Spiko Euro:** añadir a `accesoEspana_registro` el hecho de la
  web («Registrado | CNMV», que enlaza a la ESI n.º 5325 de Spiko Finance y no
  al fondo). Y en el resumen, citar la regla de Spiko tal cual: habla de
  **clases de acciones** («A share class created later needs its own
  registration»), no de «un fondo».
- **Bloqueo de la API de GECO:** no es un bloqueo. Con el cuerpo completo que
  manda el navegador, la API responde (18:08:38 UTC) y da el mismo resultado
  que el buscador.
- La huella del expediente para la página «Particulares» (4a1f29ca…) es la del
  HTML original sin recortar, no la de la «copia renderizada», como dice su
  nota. La de la copia guardada es a6e99d84….

## Bloqueos

- Folleto en español de Spiko SICAV: HTTP 403 (18:10:37 UTC). Se usan el
  inglés y el francés, con la misma huella que el vigía.
- Que Spiko Euro esté dado de alta para venderse en España no se puede
  confirmar en ninguna fuente pública. Ni la CNMV ni ESMA publican ese detalle,
  la AMF no enseña el fondo desde el 20/11 y la gestora no lo dice.
- Sábado: no hay VL nueva hasta el lunes 23/11 (Letras hacia las 18:00 UTC;
  Spiko Euro hacia las 19:30 UTC).
