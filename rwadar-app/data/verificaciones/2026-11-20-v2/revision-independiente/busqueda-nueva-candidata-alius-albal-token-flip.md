# Revisión independiente · candidata ALBAL (Alius Capital / Token Flip) · 20/11/2026

Revisé la candidata entre las 21:24 y las 21:34 UTC. No hice el análisis. Abrí
yo mismo las fuentes primarias con peticiones normales: curl con su agente por
defecto y TLS verificado, `accept-language: es` en la CNMV, y Chrome sin sesión
(agente por defecto, sin trucos) para las páginas de Alius, que se pintan con
JavaScript. No creé cuentas, no rellené el formulario de interés y no salté
ningún bloqueo. Mis copias:

- Texto (en Git): `grupos/busqueda-nueva/fuentes/revision-alius-albal/`
  (`revision-independiente-alius-albal-20.txt` con los literales,
  `consultas-revision-alius-albal-20.tsv` con hora, código, bytes y SHA-256 de
  cada consulta, `enlaces-revision-alius-albal-20.tsv` y la prueba de la
  tarjeta `tarjeta-prueba-alius-albal.cjs` con su salida).
- Crudos (fuera de Git): `grupos/busqueda-nueva/fuentes/crudo/revision-alius-albal/`.

**Resultado: rechazado. Confirmo el «no admitir» del analista.** Lo esencial
falla hoy, porque la oferta no está abierta. Además, aunque abra el 23/11, la
calidad no es aceptable para un particular: la ficha es un borrador y la
garantía, que es lo que vende la oferta, no se sostiene con los papeles
publicados. Encontré tres pegas más que el analista no anotó. Lo que hay que
devolver a los 15 meses (406.875 €) supera el valor de tasación. La tasación
valora otra promoción, no la que se financia. Y hay lenguaje de promesa y
reclamo comercial. Los enlaces funcionan, salvo una ruta de la CNMV que sale
en «bloqueos» y que hay que cambiar. La tarjeta no se propone, y está bien.
El expediente necesita retoques que no cambian la decisión (ver la sección de
correcciones al final).

## 1. Lo esencial (consultas propias de hoy)

### Entidad y registro: se sostiene, con un matiz a favor

- **CNMV, listado de PSFP** (21:26:09 UTC,
  <https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/listado-proveedores.aspx?lang=es>,
  que redirige con 301 a `…/listado-proveedores?lang=es`, 200, mismo SHA-256
  `3c4be314…` que el analista). Dice: «ADVENTUREES CAPITAL PFP, SOCIEDAD
  LIMITADA · 11 · 03/11/2023 · www.aliuscap.com». Hay 28 proveedores y ninguno
  es Token Flip.
- **Ficha n.º 11** (21:26:10 UTC,
  <https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/Proveedor.aspx?nreg=11&nif=B76632793>,
  301 y luego 200). Domicilio: «C/ SANTA TERESA DE JORNET E IBARS, 11 · SANTA
  CRUZ DE TENERIFE». En «Otras autorizaciones» no hay ninguna marcada.
- **Matiz que falta en el expediente.** La web firma como «ALIUS CAPITAL STOS
  PSFP S.L.», pero no es otra sociedad. Las condiciones generales
  (<https://aliuscap.com/general-terms>, renderizadas a las 21:31:40 UTC) dicen
  «ALIUS CAPITAL STOS PSFP S.L. (nombre comercial ALIUS CAPITAL …),
  identificada con C.I.F. B76632793», y su convocatoria de junta
  (<https://aliuscap.com/files/Alius_03_07_26_Convocatoria%20JGO_Firmado.pdf>,
  21:27:27 UTC, 200) va firmada «(R: B76632793)». Es el mismo NIF que tiene en
  la CNMV. Es un cambio de nombre que el listado de la CNMV todavía no recoge,
  no una entidad distinta.
- **ERIR.** En la ficha de Token City en la CNMV
  (<https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A25988981&lang=es>,
  21:25:35 UTC, 200, SHA-256 `12ac95b9…`, el mismo que el analista y que el
  12/11) hay una sola emisión: «06/11/2026 · SERIES A GRUPO UAE SA». TF1 no
  está. Lo amplié a las otras dos ERIR del índice
  (<https://www.cnmv.es/portal/consultas/erir?lang=es>, 21:29:47 UTC, 200):
  en MINOS SECURITIES (`A23875529`) y URSUS-3 (`A86796182`), a las 21:29:53–54
  UTC, no aparecen «TOKEN FLIP», «ALBAL» ni «TF1».
- **Emisor.** La ficha (doc. 334) dice: «Identidad: TOKEN FLIP S.A.»,
  «CIF: A05832381», «la Sociedad emisora es de reciente constitución»,
  «Estados financieros · Accesible al inversor a través del hipervínculo: […]».
  Coincide con el analista.

### Oferta abierta hoy: NO (confirmado)

- Web renderizada (21:26:36 UTC, <https://aliuscap.com/projects/albal>, 78.673
  B). Dice: «En estudio», «Objetivo 350.000,00 €», «Próximamente», «Nuestros
  proyectos pasan por una fase de estudio y estructuración previa al
  lanzamiento de la oferta de inversión. Expresa tu interés…» y «2 Inversores
  ya han expresado su posible interés en invertir». El botón del proyecto lleva a
  «declare-interest», o sea, a expresar interés. No hay forma de suscribir.
- API pública que usa la propia página, sin sesión (21:24:49 UTC,
  `…/issuance/slug/albal/expand/…`, 200, SHA-256 `f155958f…`, idéntico al del
  analista). Da `campaign_status "PRE_CAMPAIGN"`, `start_date null`,
  `end_date null`, `booked 4000`, `invested 0`. Las fases del proceso tienen
  todas las fechas en «[...]».
- La ficha dice: «Apertura el 23/11/2026. Fecha límite el 23/02/2026.» En el
  apartado 2 pone en cambio «fecha límite el 23/02/27». La contradicción es
  real.

### Acceso desde España como particular: respaldado en el papel, sin uso hoy

- La ficha, en la p. 1, recoge el periodo de reflexión de 4 días para
  «inversores no experimentados». Las condiciones generales (21:31:40 UTC)
  regulan el «Inversor No Experimentado» y el aviso por encima de «1 000 EUR o
  al 5 % del patrimonio neto». Es una plataforma española que admite
  particulares. Hoy no se puede invertir, así que en la tarjeta queda bien en
  null.

### Mínimo: 500 € (confirmado)

- La ficha, en el apartado 3, dice «Precio de suscripción: 500€ / token».
  En la API, `minimum_offer_money 500` y `asset_price "500.00"`. El campo
  `minimum_investment` de la API está en null, pero eso no cambia el dato.

### Salida: confirmada (no la hay antes del vencimiento)

- Apartado 3: «pago único, de principal más intereses, al vencimiento.
  Posibilidad de amortización anticipada del promotor». El plazo es de
  «15 meses, desde […]». Apartado 4: la venta «dependerá de la existencia de
  una contraparte interesada o de las condiciones del mercado secundario
  aplicable».
- **Matiz.** El token sale en la API con `network 80002` (Amoy, red de pruebas
  según <https://chainid.network/chains_mini.json>, 21:27:33 UTC) y
  `deployed 0`. Es cierto, pero no es algo propio de ALBAL. Las emisiones ya
  cerradas de la plataforma dan lo mismo en la API por estado (21:27:52–53
  UTC): IOD (169) y OTESA Calella Living (77) también tienen `network 80002` y
  `deployed 0`, y eso que tienen dirección de contrato. Es la forma en que esta
  API enseña todos sus tokens. No debe presentarse como un defecto
  particular de esta emisión.

### Riesgos: la advertencia legal está, pero el dato que la sostiene falla

- La p. 1 avisa de la pérdida total o parcial y de que no hay fondo de
  garantía. El apartado 4 trata del proyecto, el sector, el incumplimiento, el
  fallo tecnológico y la iliquidez. Coincide con el analista.
- El riesgo de impago se apoya en «un activo tasado en […?] M€, lo que
  representa un Loan-to-Value (LTV) del […?]%». Son huecos.
- **Tasación** (doc. 336, 21:24:53 UTC, 200, 55 páginas, mismo SHA-256
  `df8e1f1b…`). Dice: «VALOR DE TASACIÓN: 401.111,35 €», «Fecha Tasación:
  13.11.2026», «Finalidad de la tasación: INFORMACION VALOR DE MERCADO», «ESTE
  INFORME DE TASACIÓN NO ESTÁ SOMETIDO A SUPERVISIÓN POR PARTE DE BANCO DE
  ESPAÑA», «se reflejan cargas que gravan la finca valorada. Del valor
  obtenido no se ha deducido ninguna cantidad» y «hipótesis de demolición de
  las edificaciones existentes». En los propietarios pone «1307 SMARTNEX 4
  S.L. B55479091 100,00». Todo lo que dijo el analista se confirma.
- **Matiz que falta.** La portada de la tasación pone «TITULAR GARDUM 2016 SL»
  (Gardum es además quien la pidió), y la tabla registral pone SMARTNEX 4
  S.L. al 100 %. Puede que la compra aún no esté inscrita. El conflicto sigue
  en pie, pero conviene citar las dos cosas.
- **Pegas nuevas, que el analista no anotó:**
  1. **Lo que se debe supera la garantía.** A los 15 meses hay que devolver
     350.000 × (1 + 0,13 × 15/12) = **406.875 €**, más que los 401.111,35 € de
     la tasación, y eso antes de descontar las cargas, que la tasación no
     descontó. Solo el principal ya es el **87,3 %** del valor (cálculo de
     RWAdar).
  2. **La tasación valora otra promoción.** Supone derribar y construir
     «8 viviendas» sobre «988,44 m²t», con costes de construcción de
     «1.267.818,24» € (apartados J.10–J.13). El proyecto que se financia es un
     «cambio de uso y segregación» del edificio que ya existe: 5 viviendas y
     un local, con «Presupuesto Técnico de Obra: 350.000 EUR».
  3. **Cifras que no cuadran en la propia ficha.** «Importe mínimo de
     financiación requerido: 280.000€ (400 tokens)» (apartado 3 y pestaña
     «Propuesta» de la API). Con tokens de 500 €, 280.000 € son 560 tokens, y
     400 tokens son 200.000 €. La ficha también se contradice a sí misma en
     la obra: habla de «actuación de cambio de uso y segregación» y, unas
     líneas después, dice que «se construirá un edificio residencial».

### Documentos: públicos, pero la ficha es un borrador

- Doc. 334, «Anexo II · Ficha de datos fundamentales de la inversión»: 6
  páginas, creada el 16/11/2026 según sus metadatos. Tiene huecos en el
  identificador, la tasación, el LTV, el inicio del interés y del plazo, la
  fecha de firma y el enlace a los estados financieros. Está en español. Al
  ser una oferta de financiación participativa (Reglamento (UE) 2020/1503), no
  lleva KID PRIIP sino esta ficha. Es correcto.
- Doc. 336 es la tasación, de 55 páginas.
- No hay nota simple ni escritura de hipoteca, y la hipoteca está
  «anunciada», no constituida.

### Advertencias de la CNMV: ninguna (confirmado y ampliado)

Todas en `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=1&nombre=…`, entre
las 21:25:37 y las 21:26:11 UTC:

| Búsqueda | Resultado |
|---|---|
| «Token Flip», «TokenFlip», «Alius», «Adventurees», «Gardum», «Nouval», «Smartnex» | «No hay datos disponibles.» (mismos SHA-256 que el analista) |
| «Clara y Libre» (la otra socia del emisor, al 50 %; la añadí yo) | «No hay datos disponibles.» |
| «Token City» (ERIR; la añadí yo) | «No hay datos disponibles.» |
| «Gemini» (control) | «04/09/2023 GEMINI LTD FX», «29/03/2021 GEMINI OPTION LTD» |

## 2. Enlaces

Probé las 21 URL distintas del expediente y de la propuesta de tarjeta entre
las 21:28:22 y las 21:29:24 UTC, con HEAD `-L` y con GET normal. La tabla
completa está en `enlaces-revision-alius-albal-20.tsv`.

| URL | GET final | Bytes | Nota |
|---|---|---|---|
| **<https://aliuscap.com/projects/albal>** (url de la tarjeta) | 200 | 4.371 | Con curl solo llega el armazón de la aplicación. En un navegador se pinta entera: la rendericé (78.673 B). Un visitante la ve. **No es un fallo.** |
| doc. 334 (ficha) | 200 | 341.010 | PDF, mismo SHA-256. HEAD da 404 porque la API no admite HEAD; con GET va bien. |
| doc. 336 (tasación) | 200 | 6.396.690 | PDF, mismo SHA-256. HEAD da 404, igual que la anterior. |
| API `…/182/tabs` | 200 | 7.148 | JSON. HEAD da 404. |
| API `count-by-status` | 200 | 83 | JSON. HEAD da 404. |
| API `slug/albal/expand/…` | 200 | 20.489 | JSON. HEAD da 404. |
| API `status/PRE_CAMPAIGN/…` | 200 | 19.889 | JSON. HEAD da 404. |
| <https://chainid.network/chains_mini.json> | 200 | 778.383 | |
| CNMV, advertencias (8 búsquedas) | 200 | 211–217 kB | |
| CNMV, ficha ERIR de Token City | 200 | 152.454 | |
| CNMV, ficha del PSFP n.º 11 | 200 | 154.642 | Una redirección 301 a la ruta nueva |
| CNMV, listado de PSFP (en la tarjeta) | 200 | 165.165 | Una redirección 301 a la ruta nueva |
| <https://www.token-flip.com/> | 200 | 48.654 | Una redirección 301 a token-flip.com |
| **<https://www.cnmv.es/portal/consultas/esi/erir.aspx?lang=es>** | **403** | 12.239 | **Ruta rota.** Va 301 → 302 → `/Portal/Error?errorcode=CVFE` → 403 «CNMV - Error». No es antirrobots. Solo sale en «bloqueos». La buena es <https://www.cnmv.es/portal/consultas/erir?lang=es> (200 a las 21:29:47 UTC). |

Las URL de la API de Token City y la de chainid son datos en bruto. Valen como
prueba en el expediente, no como enlace para el lector. Las cuatro
`fuentesActuales` de la propuesta cargan.

## 3. Presentación de la tarjeta y la ficha

Monté una oferta de prueba con la forma de
`2026-11-13-v2/escaparate-publicacion.json`, tomando como modelo la de Hausera
(`hausera-proximas-ofertas`, del mismo tipo: deuda inmobiliaria española en
«Próximas»). Le puse los datos de la `propuestaTarjeta` y le pasé `resumenOferta`
(`rwadar-site/assets/ficha-editorial-20261022.js`). Para la línea corta usé
copias literales de las funciones de `rwadar-site/assets/rwadar-20260820.js`.
Script y salida: `fuentes/revision-alius-albal/tarjeta-prueba-alius-albal.cjs`
y `…-salida.txt`.

| Caso | Línea de la tarjeta | «Lo esencial» de la ficha | Estado |
|---|---|---|---|
| A · tal cual (`coleccion` null = principales; no verificable) | «Mínimo No verificado · España Sin confirmar» | Mínimo «Sin mínimo vigente en euros» · España «Sin confirmar» · Salida «Salida no documentada» | «No se pudo confirmar la apertura» |
| B · como «Próximas» (`en_camino`), igual que Hausera | «Mínimo 500 € (1 token) · España Sin confirmar» | **Mínimo «No documentado en euros»** · «Sin confirmar» · «Salida no documentada» | «Anuncio documentado · apertura sin confirmar» |
| B′ · igual, con el mínimo escrito «500 €» | «Mínimo 500 € · España Sin confirmar» | Mínimo «500 €» | igual |

Qué se vería y qué falla:

- **Mínimo.** Con «500 € (1 token)», la lista enseña «500 € (1 token)», pero
  la ficha dice «No documentado en euros», porque el paréntesis impide leer el
  importe. Se contradicen. Escrito «500 €», las dos dicen «500 €». No lleva
  «por token», así que cumple esa norma.
- **Resumen.** «Bono tokenizado de una promotora nueva para una obra en Albal
  (Valencia), en precampaña el 20/11/2026 y con una ficha aún incompleta.»
  tiene **133 caracteres**, por encima del tope de 120. Por lo demás está en
  castellano llano, sin promesas, sin rentabilidad ni %, y la fecha va en
  DD/MM. Una versión que cumple: «Bono de una sociedad recién creada para una
  obra en Albal (Valencia). El 20/11/2026 aún no se podía invertir.» (109
  caracteres).
- **Colección.** Si algún día se publica antes de abrir, tendría que ir con
  `coleccion: "en_camino"`, no null. Con null cae en principales como «No se
  pudo confirmar la apertura» y el mínimo sale «No verificado».
- **Título** (39 caracteres), **rentabilidad** null y **métricas** vacías:
  bien para una próxima. El 13 % no debe subir a la tarjeta.
- España y salida quedan «Sin confirmar» y «Sin documentar». Es lo correcto,
  porque hoy no se puede invertir.

Como la candidata no se admite, nada de esto llega a la web. Si se reabre el
caso, hay que aplicar estos tres cambios.

## 4. Calidad de la oferta para un particular en España

**Veredicto de calidad: no aceptable.** Es legal, porque la vende una
plataforma inscrita en la CNMV, pero hoy es mala para el lector.

- **Costes para el inversor.** La entrada no tiene coste. La ficha dice «El
  inversor no soportará coste alguno», y las condiciones generales lo
  confirman: «solamente deberá desembolsar el importe de la inversión». La
  única salvedad es que la transferencia o la tarjeta «pueden tener un coste
  que deberá asumir». No hay gestión ni diferencial, y tampoco salida
  anticipada que pagar. El promotor sí paga: 3.000 € y 1.500 € (que luego se
  descuentan), entre el «0,5% y el 2,5% de la ronda (sólo en caso de
  éxito)», ERIR «0,2% … con un mínimo de 3.000€/año» y MangoPay «0,5%». Sobre
  350.000 €, salen del orden de 6.500 a 14.000 € (cálculo de RWAdar) que no
  van a la obra.
- **Liquidez real: ninguna.** No hay reembolso antes de los 15 meses. Los
  tokens solo se entregan después de inscribir la emisión en la ERIR, y no
  hay mercado secundario. El promotor puede amortizar antes si quiere, pero
  el inversor no puede salir antes.
- **Solidez del emisor.** Es una S.A. «de reciente constitución», sin
  cuentas. Las cifras de su grupo («facturación conjunta cercana a los 4
  millones», «beneficio … aproximadamente 700.000 euros») no tienen ningún
  documento detrás. La propia presentación del emisor lo reconoce: «Cifras
  corporativas sujetas a acreditación documental antes de difusión pública»
  (<https://token-flip.com/wp-content/uploads/2026/11/Presentacion-Tokenflip-mercado-regulado-.pdf>,
  21:30:07 UTC). Su web (21:27:30 UTC) es una página de espera: «Estamos
  preparando algo grande. Próximamente!».
- **Supervisión y custodia: los papeles se concentran en un mismo grupo.**
  Alius coloca la emisión, cobra del promotor según el éxito de la
  colocación y además «será designado como comisario» del sindicato de
  obligacionistas, que es quien tendría que ejecutar la hipoteca. Token City
  es a la vez la ERIR (registro y custodia), el proveedor tecnológico (la API
  es `saas-pfp-base-api.token-city.com`) y llama a Alius «our regulated
  tokenized crowdfunding vehicle» (<https://www.token-city.com/>, 21:32:00
  UTC). Ningún tercero independiente representa al inversor.
- **Tamaño y antigüedad.** La emisión es de 350.000 € y el mínimo para que
  salga adelante, 280.000 €. Hay 4.000 € reservados y 2 interesados. El
  emisor es nuevo. La plataforma solo muestra 2 emisiones cerradas en esta
  API (octubre de 2026 y enero de 2026, las dos a 12 meses), ninguna vencida. Por eso su «Tasa de
  impago 0%» no tiene base que la respalde.
- **Riesgo concentrado.** Un solo inmueble, una sola obra y un solo promotor.
  La devolución depende de vender las viviendas en 15 meses, con la licencia
  todavía «presentada y solicitada», no concedida. La garantía, según la
  tasación pública, no cubre lo que se debe (ver el punto 1).
- **Transparencia documental: mala.** La ficha es un borrador con huecos en
  la tasación, el LTV, las fechas y el identificador. Hay cifras que no
  cuadran (los 400 tokens, el umbral a 14 meses frente a «15 meses», las
  fechas límite de 2026 y 2027). Propiedad, cargas y tipo de obra se
  contradicen entre la ficha, la web y la tasación.
- **Señales de alarma.**
  - Lenguaje de promesa en la propia ficha y en la web: «colchón financiero
    de seguridad absoluta», «Cada euro de deuda está respaldado por 3,71 € en
    ladrillo tangible», «maximizando el blindaje sobre el inversor
    minorista», «garantizando una velocidad de absorción muy alta», «Hito
    Administrativo Avalado … garantizando», «cuyo valor comercial triplica el
    préstamo». La tasación real apenas pasa de lo que se debe.
  - Reclamo comercial del emisor: un «ENCUENTRO PRIVADO DE INVERSORES · 26
    NOVIEMBRE 2026» con «Detalle de bienvenida», «Vino de honor» y «CLUB
    PRIVADO DE INVERSORES»
    (<https://token-flip.com/wp-content/uploads/2026/11/Tokenflip_Evento_26_Noviembre.pdf>,
    21:30:10 UTC), tres días después de la apertura anunciada. La
    presentación anuncia «30+ emisiones previstas en 2027» y «Viene algo
    grande».
  - El emisor se presenta como «Plataforma de financiación y estructuración
    de emisiones» y no figura entre los 28 PSFP de la CNMV. La oferta se hace
    a través de Alius, que sí figura. No es ilegal por sí mismo, pero
    confunde.
  - No hay quejas ni sanciones públicas: la CNMV no tiene advertencias sobre
    ninguna de las sociedades.
- **Comparación con lo publicado del mismo tipo.** Lo más parecido en el
  escaparate es Hausera, en «Próximas»: deuda inmobiliaria española
  tokenizada, con ERIR Ursus-3 y sin folleto. ALBAL tiene mejor envoltorio,
  porque la plataforma está inscrita en la CNMV y Hausera no. Pero su
  documento es peor: le faltan la tasación y el LTV, y la garantía publicada
  no cubre la deuda. El lector no puede comprobar lo único que hace atractivo
  el producto. No aporta nada a «Próximas» que justifique publicarla así.

**Cuándo se podría reconsiderar.** Habría que mirarla después del 23/11, y
solo si se cumplen tres condiciones. Primera, que publiquen la ficha
definitiva, sin huecos: identificador, tasación, LTV, fechas y cuentas.
Segunda, que cuadren el titular registral y las cargas, y el tipo de
garantía. Tercera, que la cobertura real, según una tasación del proyecto
que se financia, deje margen sobre lo que se debe.

## Correcciones al expediente (no cambian la decisión)

1. `entidadComercializadora` y `entidadYRegistro`: añadir que la web, las
   condiciones generales y la convocatoria de junta usan «ALIUS CAPITAL STOS
   PSFP S.L.» con el **mismo CIF B76632793** que la CNMV. Es un cambio de
   nombre que la CNMV no ha recogido, no otra sociedad.
2. Claim `token` y `salida`: matizar que la red 80002 y `deployed 0` salen
   también en las emisiones cerradas de la plataforma (IOD, 169; OTESA Calella
   Living, 77). Es la forma de la API, no un defecto propio de ALBAL.
3. Añadir un conflicto: «Importe mínimo de financiación requerido: 280.000€
   (400 tokens)». Son 560 tokens, o 200.000 € si fueran 400.
4. Añadir a `garantia`: a los 15 meses se deben 406.875 €, más que los
   401.111,35 € de la tasación, antes de las cargas. Y que la tasación supone
   otra promoción: derribo y 8 viviendas, con 1.267.818,24 € de construcción.
5. `propiedadYCargas`: citar también que la portada de la tasación pone
   «TITULAR GARDUM 2016 SL» y la tabla registral «SMARTNEX 4 S.L. 100,00».
   Añadir que la propia ficha dice «libres de cargas» y «cambio de uso», no
   solo la web.
6. Claim `comisiones`: sustituir «No se han leído las condiciones generales»
   por lo que dicen. Para el inversor, nada, salvo el posible coste de su
   banco. Para el promotor, las tarifas de este informe.
7. En `bloqueos`, cambiar la ruta del índice ERIR por
   <https://www.cnmv.es/portal/consultas/erir?lang=es> (200 a las 21:29:47
   UTC).
8. Añadir a `porQueNo` y a `riesgosYAlertas` el lenguaje de promesa, el acto
   comercial del 26/11 y la concentración de papeles: Alius coloca, cobra y
   es comisario, y Token City es ERIR y proveedor tecnológico.
9. `propuestaTarjeta` (solo si se reabre el caso): resumen de 120 caracteres
   o menos; mínimo «500 €», sin «(1 token)»; `coleccion: "en_camino"`.
