# Revisión de cumplimiento · entrega 2026-11-21

Revisor independiente de cumplimiento (MiFID II, MiCA, Folletos, ECSP,
régimen piloto DLT y Circular 2/2020 de la CNMV). No monté esta entrega. Una
sola revisión, como pide el responsable del proyecto: empiezo por
`DIFF-ENTREGA.md` y lo compruebo con fuentes abiertas hoy por mí. Hora:
21/11/2026, de 21:23 a 21:50 UTC.

**Veredicto: aprobada con dos cambios. Los dos cambian el SQL**: una etiqueta
de mTBILL que pone una fecha falsa a las Condiciones Finales y una frase de
Brickwise que da como hecho lo que solo dice Brickwise. Ninguno de los dos
cambia un botón, una tarjeta ni el acceso desde España.

## Qué he comprobado

1. **El SQL es el que dice el montador.** `aplicar-y-aprobar.sql` tiene
   SHA-256 `c7f99442…fe5f` (también en el commit `9b9ec4df`). Solo inserta en
   `rwadar_catalogo` (22 ofertas, 25 plataformas y sus fuentes y alertas), con
   la guarda, y aprueba la revisión al final. No toca usuarios, permisos ni
   esquema. No lleva el nombre del responsable: la cabecera dice «pedida por el
   responsable del proyecto».
2. **Lo que ve un visitante después de aplicar.** He comparado campo a campo
   lo publicado (`lectura-publica/ofertas-v2.json`, 17:36 UTC) con lo que
   exporta el ensayo del montador (PGlite, 21:03 UTC). Cambian:
   - los avisos de 17 fichas: Aktionariat, Kraken, Prosegur, Boss Info,
     Switzerlend, las 11 de Brickwise y Hausera;
   - las métricas de Aktionariat, de Smart Cash y de las dos Letras de Spiko.
     Las de Switzerlend y Hausera también cambian en el SQL, pero no se ven
     mientras sigan en «no verificable»;
   - el texto de la rentabilidad de las tres de Spiko: la fecha de consulta y,
     en Letras Euro, también la redacción;
   - las fuentes de Letras Dólar (se añade la CNMV);
   - la documentación de las 22.

   No cambia en ninguna ficha `disponible_es`, `eu`, la colección ni el
   estado de revisión. Tampoco cambia el «Cumple / no cumple» de
   transparencia: supervisada y documento para España dan lo mismo que el
   20/11, ahora con fecha del 21/11.
3. **Rentabilidades.** Las tres de Spiko siguen con base (31 días o tipo neto
   publicado), fecha del valor liquidativo (20/11) y «Variable y no
   garantizado» o «no es un tipo fijo ni está garantizado». La API de Spiko
   da hoy las mismas cifras (ver tabla). mTBILL sigue con «es pasada … y no
   garantiza la futura». Ninguna ficha de reventa ni la Próxima lleva
   rentabilidad.
4. **Promesas.** Ningún texto nuevo promete rentabilidad, garantía ni
   liquidez. Hay dos frases que piden cuidado:
   - **Switzerlend, «Clase».** Ya lleva «si el dinero alcanza» y «(no es un
     tope)», así que no se lee como un cobro asegurado.
   - **Aviso nuevo de las 8 de Brickwise con número fiscal.** Dice «no cuesta
     nada» sin decir que lo dice Brickwise. Es la corrección C2.
5. **Riesgos en los avisos.** Ninguna ficha pierde el aviso de pérdida, de
   salida o de supervisión.
   - **Las 6 de Brickwise con aviso de cuenta nuevo.** Ya no dicen en los
     avisos que la distribución en España no está confirmada. Lo sigue
     diciendo su «Acceso desde España», que es lo que ve el visitante en «Lo
     esencial»: «Sin confirmar: … no consta que esta emisión se distribuya en
     España». No bloquea; ver recomendada 3.
   - **Prosegur.** El aviso nuevo es más preciso que el de ayer y coincide con
     la lista de la CNMV (ver tabla).
   - **Kraken.** El aviso de dividendos sin «en EE. UU.» lo respalda su página
     de ayuda: la retención del 30 % vale también para las de otros mercados.
6. **Acceso desde España.** En todas las fichas que lo afirman se apoya en una
   fuente primaria:
   - Robinhood, Kraken y Spiko: registro de la CNMV;
   - mTBILL: Condiciones Finales con España;
   - Prosegur: contrato;
   - Aktionariat, Boss Info y Switzerlend: condiciones del portal con la lista
     de países;
   - Spiko: tabla de países de Spiko.

   Donde no se puede confirmar, la ficha lo dice: «Sin confirmar» en las 11 de
   Brickwise, y «según Spiko» con su aviso en Smart Cash (ver recomendada 1).
7. **Botón (revisión legal 06/11/2026, punto 5.3).** La regla está en tres
   sitios:
   - `rwadar-site/assets/rwadar-20260820.js:2919`;
   - `rwadar-fichas.js:216`;
   - `rwadar-movil/componentes/Ofertas.js:458`.

   «Ver oferta en X» solo sale si se contrata hoy desde España (principal,
   `disponibleEs` verdadero y acceso «sí» con fuente) **y** la entidad que la
   ofrece está supervisada. Ninguna ficha tiene `tipo` «secundario» ni mercado
   propio, así que la web, las fichas fijas y la app dan lo mismo. Lo he visto
   en las 22 páginas que generó el ensayo
   (`<scratchpad>/ensayo-2026-11-21/rwadar-site/ofertas/`): **son las mismas
   que las publicadas hoy**.

   | Botón | Fichas |
   |---|---|
   | «Ver oferta en Spiko» | Letras Euro, Letras Dólar, Smart Cash |
   | «Ver oferta en Robinhood Europe» | Robinhood Classic Stock Tokens |
   | «Ver oferta en Kraken (Payward Europe Digital Solutions)» | Kraken xStocks |
   | «Ir a la web del proveedor (sales de RWAdar)» | las otras 17: mTBILL, Prosegur, Aktionariat, Boss Info, Switzerlend, las 11 de Brickwise y Hausera |

   Mis dos correcciones no cambian ninguno.
8. **Datos personales.** He revisado los 13 archivos del commit `9b9ec4df` (los
   tres del SQL, `decisiones.json`, `DIFF-ENTREGA.md`, `INFORME-ENTREGA.md` y
   los demás JSON del ciclo) y está limpio:
   - **Nombres:** no está el autor de la ayuda de Brickwise ni ninguno de los
     nombres de consejeros (30 candidatos) que traen las copias en bruto del
     registro suizo. Una búsqueda de nombres de pila seguidos de apellido no
     da nada.
   - **Correos y teléfonos:** ninguno.
   - **Direcciones de cadena:** solo tres, y son contratos de tokens, no
     monederos de personas.
   - **El nombre del responsable:** no aparece.
   - **Copias en bruto:** las de los grupos (`grupos/**/crudo/`,
     `revision-independiente/**/crudo/`) están fuera de Git por el
     `.gitignore` del ciclo, y ninguna está en Git.

   Este informe no lleva nombres de personas.

## Fuentes abiertas hoy por mí

| Qué | URL | Hora UTC | Literal | Resultado |
|---|---|---|---|---|
| Ayuda de impuestos de Brickwise | https://www.brickwise.at/support/wie-sind-die-ertrage-zu-versteuern-2 | 21:29:32 (SHA-256 `b941508f…282bf`, el mismo que los revisores) | «Gerne stellt Brickwise auch einen Kontakt zu einem Steuerberater her. In diesem Fall entstehen für die Beantragung der Steuernummer keine Kosten» · «Diese Einkünfte sind auch für ausländische Investor:innen in Österreich steuerpflichtig. Je nach DBA … befreit oder … anrechenbar» · «Hinweis: … keine steuerliche Beratung» | Lo de «no cuesta nada» lo dice solo Brickwise (C2) |
| Condiciones Finales de mTBILL | https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media | 21:39:25 (SHA-256 `b1e58001…944a`) | «FINAL TERMS DATED 17 July 2026» · «Offer(s) to the Public … Spain» · «Prohibition of Sales to … not applicable» | Son del 17/07/2026, no del 21/11 (C1) |
| Ficha de mTBILL que genera el ensayo | `<scratchpad>/ensayo-2026-11-21/rwadar-site/ofertas/mtbill.html` | página de las 21:04 | «Países de oferta pública · Condiciones Finales del 21/11/2026 · Dato fechado: 17/07/2026 · Consulta: 21/11/2026» (la publicada dice «del 17/07/2026») | La fecha nueva es falsa y choca con la de al lado (C1) |
| Proveedores de criptoactivos de la CNMV | https://www.cnmv.es/Docportal/Proveedores-Servicios-Criptoactivos/Listado_ProveedoresCriptoactivos.pdf | 21:33:20 (SHA-256 `0dea9e14…f7e7`, PDF del 16/11/2026) | «PROSEGUR CUSTODIA DE ACTIVOS DIGITALES, S.L. · PSC (ESPAÑA) · Custodia y administración · Recepción y transmisión órdenes · Servicios de transferencia · 30/06/2026» | El aviso nuevo de Prosegur es correcto |
| Spiko SICAV en la CNMV | https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es | 21:33:55 y 21:34:12 (pestaña de comercializadoras) | «SPIKO SICAV · 2380 · 30/01/2026 · SICAV · FRANCIA · IIC Comunitaria»; solo hay dos pestañas, «Datos generales» y «Entidades comercializadoras» («ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA DE VALORES») | La referencia nueva de Letras Dólar es correcta. La CNMV no enseña los fondos uno a uno |
| Base GECO de la AMF | https://geco.amf-france.org/back-office/funds/compartment/c124199 | 21:35:09 | `"published":false`; en `/shares`, `[]`. Letras Euro (`c79399`): «Vivant», «Tous souscripteurs» | Smart Cash sigue sin ficha en la AMF |
| Tabla de países de Spiko | https://docs.spiko.io/documentation/product_overview/fund_availability | 21:45:40 (SHA-256 `179ef546…8fc5`) | «🇪🇸 Spain ✅ ✅ ✅ ❌» · «A share class created later needs its own registration before it can be distributed there» · «Last updated: November 13, 2026» | El acceso de las tres se apoya en esta tabla |
| API de Spiko | https://public-api.spiko.io/v0/share-classes/EUTBL/yield (y USTBL, eurSAFO, y `/net-asset-values/…/latest`) | 21:35:54–21:35:56 | Letras Euro: VL 1,063496 (fechada el 22/11, calculada el 20/11 a las 17:18 UTC) y 0,0245 · Letras Dólar: 1,103573 (20/11) y 0,04 · Smart Cash: 1,017886 (20/11) y 0,0284 | 2,45 %, 4,00 % y 2,84 %, como la entrega |
| KID en español de Letras Euro y Letras Dólar | https://cdn.spiko.finance/legal_docs/ES/KID_EUTBL_ES.pdf y https://cdn.spiko.finance/legal_docs/ES/KID_USTBL_ES.pdf | 21:35:20–21:35:21 (SHA-256 `cb1a621d…3325` y `c1ce5400…92f6`) | «Riesgos importantes para el Producto no tenidos en cuenta en este indicador: … uso de un TRD … la cartera necesaria…» · Dólar: «Este riesgo no se tiene en cuenta en el indicador anterior» | La métrica nueva «Riesgo KID» se sostiene |
| Ayuda de Kraken sobre xStocks | https://support.kraken.com/articles/xstocks-faq | 21:36:07 | «Net Dividend (after applicable withholding tax, which is 30% for US-listed and regional-listed xStocks)» | El aviso sin «en EE. UU.» es correcto |
| Libro y operaciones de Aktionariat | https://shares.aktionariat.com/api/secondarymarkets/getOrderBook y `/getTrades` (company 77) | 21:36:39 | venta más barata 6,20 × 356 · hoy, 08:02:23 UTC, 62 acciones a 5 (secundario) · última compra al emisor el 31/10, 1 a 7,25 | El aviso nuevo es correcto |
| CNMV, empresas de servicios de inversión del EEE en libre prestación | https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325 (y 5299, 4474, 5003; agentes de 5003 en `&vista=8`) | 21:38:54–21:39:09 | «SPIKO FINANCE SASU · 5325 · 14/01/2026» · «ROBINHOOD EUROPE, UAB · 5299 · 21/04/2025» · «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED · 4474 · 05/01/2018» · «EFFECTA GmbH · 5003 · 11/11/2020», agentes: «No se han encontrado datos disponibles» | Los 5 «Ver oferta en X» se sostienen. El agente de Brickwise no está notificado para España |
| Registro de emisiones en cadena de Ursus-3 (CNMV) | https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es (y páginas 2 y 3) | 21:42:07–21:42:23 | La más reciente es «23/10/2026 · HAUSERA PROPERTY MANAGER SPV 7, SA / SPV 8»; no hay SPV 10 ni SPV 11 | Alicante 3 sigue sin inscribir: el aviso es correcto |
| Ficha de Alicante 3 | https://hausera.io/propiedad/alicante_3/ | 21:42:30 | «PREVENTA ABIERTA» · «Inicio de preventa: 18/11/2026» · «Inicio de oferta pública: 25/11/2026» | El mínimo corto y la tarjeta se sostienen |
| Advertencias de la CNMV | https://www.cnmv.es/portal/resultadobusqueda?tipo=1&nombre=Spiko&lang=es (una búsqueda por nombre) | 21:31:59–21:33:11 | «No hay datos disponibles.» en las 24 búsquedas: Spiko, Brickwise, Effecta, Brick Qogir, Brick Sagarmatha, BrickOne, Hausera, HOLDTX, Hausera Property, Ursus, Prosegur, Midas, Midas Software, Aktionariat, Boss Info, bossinfo, Switzerlend, Lend.ch, Kraken, Payward, xStocks, Robinhood, Backed y Twenty First | Ninguna advertencia |
| Control de que el buscador funciona | la misma búsqueda con `nombre=Trading` | 21:32:25 | 10 filas, por ejemplo «10/11/2026 · LEZTRUVINTRADING» | El buscador funciona |

## Correcciones obligatorias (las dos cambian el SQL)

### C1 · mTBILL: la etiqueta pone a las Condiciones Finales una fecha que no es la suya

**Qué pasa.** La etiqueta publicada es «Países de oferta pública ·
Condiciones Finales del 17/07/2026». `decisiones.json` la cambia a «… del
21/11/2026». Pero el documento dice «FINAL TERMS DATED 17 July 2026» (mismo
archivo, `b1e58001…`). Así la ficha enseña «Condiciones Finales del
21/11/2026 · Dato fechado: 17/07/2026». Es justo el documento en el que se
apoya el acceso desde España de mTBILL. Fecharlo mal hace creer que hay
condiciones nuevas de hoy. Ni el expediente ni DECISIONES lo piden: solo
piden poner la consulta de hoy.

**Cambio exacto en `decisiones.json`.** Va en `ofertas.mtbill.cambios`, en el
cambio `"tipo": "referencia"` con
`"etiqueta": "Países de oferta pública · Condiciones Finales del 17/07/2026"`:

- Quitar de `despues` la clave
  `"etiqueta": "Países de oferta pública · Condiciones Finales del 21/11/2026"`.
- Dejar `alcance` y `fechaConsulta` (`2026-11-21`) como están.

La referencia queda con la etiqueta «Países de oferta pública · Condiciones
Finales del 17/07/2026», la consulta del 21/11/2026 y el dato del 17/07/2026.
Para que el ensayo lo compruebe, añadir a `comprobar.ausentes` el texto
`Condiciones Finales del 21/11/2026`.

### C2 · Las 8 de Brickwise con número fiscal: «no cuesta nada» es lo que dice Brickwise, no un hecho comprobado

**Qué pasa.** El aviso nuevo (plantilla `AVISO_NF`) dice: «…si lo pides con
el asesor fiscal que te presenta Brickwise, no cuesta nada». Es fiel al
literal de la ayuda («In diesem Fall entstehen für die Beantragung der
Steuernummer keine Kosten»). Pero lo afirma solo Brickwise, la plataforma que
vende y que presenta al asesor, y RWAdar no puede comprobarlo. Además va en un
aviso, donde suaviza la advertencia. Hay que atribuirlo, como en el resto del
catálogo («según Spiko», «según su contrato»). También conviene que «no cuesta
nada» se refiera solo a pedir el número, que es lo que dice el literal.

**Cambio exacto en `decisiones.json`.** En `plantillas.AVISO_NF`:

- Donde dice: `Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, si lo pides con el asesor fiscal que te presenta Brickwise, no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.`
- Poner: `Para comprar hace falta un número fiscal austriaco: se pide a Hacienda de Austria y, según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada. Las rentas tributan en Austria (la emisora presenta una declaración conjunta) y, si vendes con ganancia, pagas allí la ImmoESt.`

Son 290 caracteres frente a 288. Cambian las 8 fichas que usan la plantilla,
todas con un cambio `avisoNuevo`: Plüddemanngasse, Sonnleithnergasse,
Klagenfurt, Stallhofstraße, Schwarzer Weg, Drautalresidenz, Randhartingergasse
e Hinterstoder. En las dos últimas, además, se quita el aviso viejo.

En la `prueba` de esos 8 cambios hay que añadir
`{"documento": "REVISION-ENTREGA-cumplimiento.md", "contiene": "según Brickwise, pedirlo con el asesor fiscal que te presenta no cuesta nada"}`.
En `comprobar.ausentes` hay que añadir
`si lo pides con el asesor fiscal que te presenta Brickwise, no cuesta nada`.
No hace falta ninguna fuente nueva: la de la ayuda ya está en las 8.

**Después de C1 y C2:** `preparar` (dos veces), `comprobar` y `auditar`.
Como el SQL cambia, después va el auditor. Cambian 9 sentencias de ofertas
que ya cambiaban hoy, y el inventario sigue en 288.

## Recomendadas (no bloquean esta entrega)

1. **Smart Cash, botón «Ver oferta en Spiko».** Cumple la regla: Spiko Finance
   está en la CNMV (n.º 5325) y la tabla de Spiko marca España. Pero hoy es el
   segundo día seguido sin ficha del fondo en la AMF (`"published":false`). La
   propia Spiko dice que una clase creada después de la inscripción «needs its
   own registration», y nadie publica que este fondo la tenga en España. Para
   el próximo ciclo: pedir a Spiko la notificación a la CNMV o pasar el acceso
   a «Sin confirmar» con el arreglo de `resumenOferta` (opción (b) del
   auditor). Entonces el botón pasaría a «Ir a la web del proveedor (sales de
   RWAdar)».
2. **Brickwise, impuestos en España.** La misma ayuda dice que, según el
   convenio de doble imposición, el país donde vives deja esas rentas exentas
   (pero cuentan para el tipo) o descuenta el impuesto austriaco. «Las rentas
   tributan en Austria» puede leerse como que en España no hay nada que
   declarar. Propuesta para el próximo ciclo, en la referencia «Número fiscal
   austriaco»: «Si vives en España, también cuentan en tu declaración, según
   el convenio de doble imposición». Conviene también decir en la ficha que el
   documento informativo de la emisión (Informationsblatt) habla de la KESt,
   al contrario que la ayuda de hoy. Es un conflicto de fuentes que anotan los
   expedientes y que la ficha no cuenta.
3. **Las 6 de Brickwise con aviso de cuenta nuevo.** Para que digan lo mismo
   que Randhartingergasse, Hinterstoder y las tres KESt: «Cuenta abierta a
   residentes del EEE, pero la app no deja comprar esta emisión sin número
   fiscal austriaco; no consta que se comercialice en España y la
   documentación está en alemán.»
4. **Mínimo en reventa cuando lo más barato solo se vende en lote.** Pasa en
   Cohotel (110 € frente a 120 € la suelta), Randhartingergasse (78/85),
   Hinterstoder (75/82), Plüddemanngasse (75/99) y Sonnleithnergasse (75/80).
   El mínimo de la tarjeta queda por debajo de lo que de verdad cuesta
   entrar. Lo corrigen la referencia «Orden de venta de menor importe» y el
   aviso de los lotes. Las Normas de las tarjetas ya ponen como ejemplo «1
   participación desde 78 € en reventa (03/11)»: conviene que el motor admita
   ese formato.
5. **Boss Info y Switzerlend.** Al estar en «no verificable», sus métricas no
   se ven, y ningún aviso dice «sin folleto ni KID» ni «el emisor no está
   supervisado». Solo lo dice el bloque de transparencia. Conviene un aviso
   como el de Aktionariat.
6. **Randhartingergasse.** «Mientras esté vacía no hay repartos» lo deduce
   RWAdar; ninguna fuente lo dice. Según la auditoría, la app enseña «Erw.
   nächste Ausschüttung: 15.12.2026». Mejor: «si sigue vacía, puede no haber
   repartos».
7. **Kraken, alcance de «Salida».** Dice a la vez «Comprobado de nuevo … el
   21/11/2026» y «consultada el 03/11/2026». Es una errata de fecha en el dato
   de salida.
