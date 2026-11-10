# Edición de noticias · Inicio · 10/11/2026

Redactor jefe: Claude, 10/11/2026. Archivo publicado: `noticias-2026-11-10.json`
(8 noticias: 3 de «Hoy» y 5 de «Lo más importante», de los últimos 30 días).

Base: las candidatas de `analista-regulacion.md` y `analista-mercado.md`, más
`grupos/ampliacion/barrido-*.md`, `grupos/*/resumen-*.md` y
`DECISIONES-COORDINADOR.md`. **Cada fuente elegida se volvió a abrir con curl
entre las 15:37 y las 15:40 UTC** (copias de trabajo en el directorio temporal
de la sesión, fuera del repositorio). Todas dan la misma huella SHA-256 que
anotaron los analistas, salvo la app española de Robinhood, que no la anotaron
(ver la tabla del final).

Criterios, por orden: 1) que afecte a lo que un particular en España puede
comprar o a su protección; 2) que venga del regulador o del propio emisor;
3) que mueva el sector de forma medible; 4) que sea reciente. Fuera: rumores,
opiniones, precios de criptomonedas, notas sin fuente primaria y autobombo.

## Hoy (10/11 y 09/11)

1. **La CNMV advierte de nueve entidades sin registro (10/11).** Es el único
   hecho del mismo día con fuente oficial y va directo a la protección del
   inversor. He comprobado en el PDF que son nueve: una web «(clon)» que «No
   guarda relación con XTB S.A., SUCURSAL EN ESPAÑA» y dos apps «(CLON)» que no
   guardan relación con PJT Partners Park Hill (Spain), A.V. Quito la frase
   del analista «ninguna ofrece activos tokenizados»: el PDF no lo dice.
2. **Suplemento del folleto de los Stock Tokens de Robinhood Assets (Jersey)
   (09/11).** Es lo que más puede cambiar lo que se compra desde España: el
   folleto base tiene a España entre los países notificados y el suplemento
   dice «The Issuer anticipates appointing Robinhood Europe, UAB as an
   Authorised Participant in the near future». Lo presento como plan, no como
   hecho. Añado el riesgo que también trae el suplemento: el emisor podrá
   repercutir costes «which may include proportionately reducing the number of
   Products held by such Investors». La afirmación de que la app española solo
   ofrece los «Classic» sale de robinhood.com/eu/es/invest, abierta a las
   15:39 UTC («Explora más de 2.000 Classic Stock Tokens…»). Fuente tipo
   `empresa` (el propio emisor), no el registro de la FMA.
3. **BCE, Comisión y ESMA buscan miembros para el European Tokenisation
   Standards Group (09/11).** Es regulador y del día anterior. Digo con
   claridad que va dirigido a la industria mayorista («wholesale financial
   industry stakeholders») y que hoy no cambia nada para el particular. Plazo:
   «27 November 2026».

## Lo más importante (últimos 30 días)

4. **Pagarés de Prosegur Cash en registro DLT (06/11).** La única emisión
   tokenizada nueva de una empresa española con registro oficial de la CNMV
   en la ventana: «1ª Emisión de Pagarés Prosegur Cash 2026» por 500.000 €, con
   Minos Securities, A.V., S.A. como entidad responsable del registro. Llevo el
   aviso de la propia CNMV («no implica que la CNMV haya validado las
   condiciones de la emisión») y que no hay documento público
   (`resumen-candidatas-espana.md`, DECISIONES §3). Quito tres cosas del
   analista que la fuente no dice: «grupo Prosegur», «primera emisión de una
   cotizada del Ibex Medium Cap» y «el registro ERIR pasa de una entidad a
   tres».
5. **El Consejo quiere subir el tope del régimen piloto DLT a 300.000
   millones (Coreper, 04/11).** Es el cambio normativo más grande del mes para
   el sector. Del texto (ST 13779/1/26 REV 1, considerando 76): se retiran los
   topes por activo y el tope agregado de 6.000 millones «should be raised to
   EUR 300 billion». **Corrijo al analista:** el tope es por infraestructura
   («financial instruments intermediated by a DLT market infrastructure»), no
   un total de la UE. ST 14900/26 confirma «General approach approved by
   Coreper. Part 2, on 04.11.2026». No digo nada del ECOFIN del 09/11: su
   resultado no se pudo confirmar (la web del Consejo da 403). Lo presento como
   posición negociadora pendiente del Parlamento.
6. **La CNMV autoriza Bit2Me STX (nota del 28/10).** Segundo sistema DLT de
   negociación y liquidación en España. La lista de ESMA (PDF creado el
   04/11/2026) da dos en España: Securitize Europe DLT TSS (26/11/2025) y
   Bit2Me STX DLT TSS (27/10/2026). Uso la fecha de la nota de la CNMV (28/10),
   que es el enlace que ve el lector, y cito la de ESMA en el nombre de la
   fuente. Es una candidata que traían los dos analistas: va una sola vez.
7. **ESMA, pregunta y respuesta 2950 (16/10).** Protección directa: las cuotas
   de acceso «may raise investor protection concerns» si se cobran antes de dar
   la información clave, si no se dice a quién van o si crean conflictos de
   interés. Algunas emisiones tokenizadas que hemos estudiado se venden por
   plataformas de financiación participativa (Profitus, en
   `resumen-candidatas-europa.md`).
8. **La CNMV abre a consulta ampliar su servicio de reclamaciones a
   proveedores de criptoactivos y plataformas de financiación participativa
   (15/10).** Protección del inversor en España. Es un proyecto, con comentarios
   hasta el 16/11/2026.

## Por qué quedan fuera las demás

- **rwa.xyz, tamaño del sector (10/11).** Es la medida de un agregador
  privado, no un hecho fechado ni de un regulador o emisor, y depende de sus
  definiciones («distributed» frente a «represented»). Además, el gráfico
  «La tokenización en el mundo» de Inicio ya va a mostrar esas cifras: no las
  repito como noticia.
- **Seturion de Börse Stuttgart (licencia BaFin del 16/10).** Importante, pero
  el producto para particulares (estructurados de Société Générale vía
  flatexDEGIRO) sigue anunciado, sin emisión ni folleto. Con Bit2Me STX ya
  cubrimos «nuevas infraestructuras DLT», y con la española, que es la que
  afecta al lector. Quedó sexta.
- **Abanca y Webull en el listado MiCA de la CNMV (06/11 y 01/11).** Son
  servicios de criptoactivos, no de activos reales. No se ha comprobado que
  Abanca ofrezca ya el servicio.
- **Preguntas y respuestas de la CNMV sobre folletos (28/10).** El documento
  no menciona la tokenización: relevancia baja.
- **Amundi, clase tokenizada de un fondo indexado (05/11).** Para
  institucionales y plataformas: sin ISIN, KID ni distribuidor para
  particulares.
- **DTCC Tokenization Service (28/10).** EE. UU. y solo para participantes de
  DTC.
- **Primer bono digital del MEDE en Pontes (26/10).** Mayorista; la cotización
  y su uso como garantía están «expected».
- **Hong Kong, negociación secundaria de fondos monetarios tokenizados
  (26/10).** No es accesible desde España.
- **Iberdrola, BBVA y Santander, préstamo sindicado en DLT (15/10).**
  Operación entre bancos y empresa, sin producto para particulares.
- **Ya descartadas por los analistas:** ESMA sobre stablecoins y colateral
  tokenizado (08 y 09/10, fuera de la ventana), hackeo de Binance y caso Crédit
  Mutuel Arkéa (cripto o banca, sin fuente primaria abierta), Schroders,
  Janus Henderson y Generali (institucionales), NYSE y Canton (EE. UU.), y el
  folleto de Ondo (hecho de mañana, sin comprobar).

## Fuentes vueltas a abrir hoy

| Noticia | Fuente | Hora UTC | SHA-256 (inicio) |
|---|---|---|---|
| 1 | CNMV, advertencia del 10/11 (PDF) | 15:37 | `d6d617a4766a5c43` |
| 2 | Suplemento RHJ del 09/11 (PDF) | 15:37 | `978eea67a47d5bb6` |
| 2 | robinhood.com/eu/es/invest/ | 15:39 | `8ba566150227848b` |
| 3 | ESMA, noticia ETSG | 15:37 | `d172fea1ccce11d9` |
| 4 | CNMV, registro ERIR de Minos Securities | 15:38 | `6d7eb7cbca433bc8` |
| 5 | Consejo, ST 13779/1/26 REV 1 (PDF) | 15:37 | `757b8851957af55c` |
| 5 | Consejo, ST 14900/26 (PDF) | 15:37 | `54f5eeefda10ae00` |
| 6 | CNMV, nota del 28/10 (PDF) | 15:37 | `e09fadd373bf3621` |
| 6 | ESMA, lista de infraestructuras DLT (PDF) | 15:38 | `8f223820d3223598` |
| 7 | ESMA, Q&A 2950 | 15:38 | `20be52a638f4bf73` |
| 8 | CNMV, nota del 15/10 (PDF) | 15:37 | `289265b26b53f727` |

Nada de esto es una recomendación. Ninguna noticia da precios ni promete
rentabilidad.

## Adenda del 10/11/2026 (tarde) · titulares v2 (rediseño de Inicio)

Víctor, el 10/11: «los titulares no atraen nada». El coordinador de la sesión
del rediseño de Inicio (Claude) reescribió los 8 `titulo` y `en.titulo` de
`noticias-2026-11-10.json` (commit «Inicio por bloques (web y app) y fotos en
las noticias») y los cotejó con el `resumen`, el `porQueImporta` y la fuente de
cada noticia (las frases literales están en `VERIFICACION.md`, en el apartado
de cada una). No cambia ningún dato, cifra, fecha ni fuente: solo el titular.
`tituloInformativo` se conserva tal cual: es el titular neutro de la
verificación y sigue sirviendo de referencia. El de la UE se ajustó después,
en las correcciones de la revisión (commit «Rediseño de Inicio: correcciones
de la revisión»): «la UE quiere» pasó a «los Veintisiete quieren», que es más
exacto (la fuente es la posición del Consejo, es decir, de los Estados) y casa
con el inglés «EU states want».

| # | Antes (verificado por la mañana) | Ahora | En qué se apoya (VERIFICACION.md) |
|---|---|---|---|
| 1 | Clones de XTB y PJT: la CNMV alerta de 9 webs y apps sin licencia · *XTB and PJT clones: Spain’s CNMV flags 9 unlicensed sites and apps* | La CNMV destapa un clon de XTB y otros 8 chiringuitos · *CNMV exposes an XTB clone and 8 other unlicensed firms* | §1: nueve entidades «no figuran inscritas … no están autorizadas para prestar servicios de inversión»; una dice no guardar relación con XTB (clon). 1 clon de XTB + otras 8 = 9. «Chiringuito» es la palabra corriente en España para una entidad no autorizada. |
| 2 | Stock Tokens de Robinhood: el emisor podrá restar tokens por costes · *Robinhood Stock Tokens: the issuer may cut tokens to cover costs* | Los Stock Tokens de Robinhood podrán cobrarse costes en tokens · *Robinhood’s Stock Tokens may charge costs in tokens* | §2, punto (1)(C) del suplemento: el emisor puede repercutir costes al inversor, «which may include proportionately reducing the number of Products held». |
| 3 | Europa busca un idioma común para los mercados tokenizados · *Europe seeks a common language for tokenised markets* | Europa busca el idioma común de los tokens · *Europe seeks a common language for tokens* | §3: el ETSG nace para «develop common standards for an interconnected tokenised financial ecosystem». |
| 4 | Pagarés de Prosegur Cash en DLT: 500.000 € inscritos en la CNMV · *Prosegur Cash paper on DLT: €500,000 issue registered in Spain* | Prosegur Cash tokeniza 500.000 € en pagarés · *Prosegur Cash tokenises €500,000 of commercial paper* | §4: inscripción en la CNMV de la emisión de pagarés de 500.000 € anotada en registro DLT; el aviso de que inscribir no valida sus condiciones sigue en el `porQueImporta`. |
| 5 | Los Estados de la UE quieren multiplicar por 50 el tope DLT · *EU states want a 50-fold rise in the DLT Pilot Regime cap* | Mercados tokenizados: los Veintisiete quieren un límite 50 veces mayor · *Tokenised markets: EU states want a cap 50 times higher* | §5, considerando 76: de 6.000 a 300.000 millones de euros («the aggregate cap should be raised to EUR 300 billion»): 50 veces. Posición del Consejo (los Estados), no ley aprobada. |
| 6 | España suma su segundo mercado de valores tokenizados: Bit2Me STX · *Spain gets its second tokenised securities market: Bit2Me STX* | España ya tiene dos mercados de valores tokenizados · *Spain now has two tokenised securities markets* | §6: nota de la CNMV del 28/10 y lista de ESMA, con solo dos infraestructuras españolas (Securitize y Bit2Me STX). |
| 7 | ¿Te piden pagar antes de ver los proyectos? ESMA ve un riesgo · *Asked to pay before seeing the projects? ESMA sees a risk* | ¿Te cobran antes de enseñarte el proyecto? Ojo, avisa ESMA · *Charged before you see the project? ESMA says watch out* | §7, Q&A 2950: cobrar una cuota de acceso antes de ver la información clave puede perjudicar al inversor. |
| 8 | La CNMV quiere atender tus quejas contra cripto y crowdfunding · *Spain’s CNMV wants to handle your complaints on crypto and crowdfunding* | La CNMV abre la puerta a tus quejas contra plataformas cripto · *Spain’s CNMV opens the door to your crypto platform complaints* | §8: proyecto de Circular en consulta para ampliar el procedimiento de reclamaciones a los proveedores cripto y a las plataformas de financiación participativa; el `resumen` dice que es una consulta. |

Notas de las revisoras independientes, para quien edite el próximo ciclo (no
se ha cambiado nada por ellas):

- 1: de las otras 8, dos también son clones (de PJT Partners); el titular
  anterior lo decía. «Chiringuito» es más llano, pero menos exacto.
- 2: el inglés («may charge costs in tokens») hace sujeto a los tokens; la
  fuente dice que el emisor puede restar tokens al inversor para cubrir costes.
- 3 y 8: «el idioma común de los tokens» es vago, y «abre la puerta» suena a
  hecho cuando es un proyecto en consulta (el resumen lo aclara).
