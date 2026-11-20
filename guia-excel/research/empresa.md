# Trabajar con Excel en una empresa de verdad · lo que separa a quien sabe fórmulas de quien es autónoma

Investigación a **14/11/2026** para la guía interactiva de Excel (es-ES, nivel 0 → autonomía en proyectos).
Convenciones: fórmulas en español con `;` y coma decimal; **[VERIFICADO: url]** = comprobado en fuente primaria en esta sesión; **[VERIFICADO-sec: url]** = comprobado solo en prensa o fuente secundaria fiable; **[CORREGIDO: url]** = el dato original era inexacto y ya está corregido según esa fuente; **[NO VERIFICABLE: no enseñarlo como dato]** = no hay fuente fiable y no se enseña como dato; **[SIN VERIFICAR]** = dato conocido o razonable que no se pudo comprobar hoy.
Complementa a `curriculo.md` (nivel N6 y rúbrica), `excel-moderno.md` (coautoría §1.9, IA §4.3) y `localizacion.md` (CSV §6). No repito lo que ya está ahí: lo enlazo.
Nota de método: el cupo de búsquedas web se agotó a mitad del trabajo. Lo que quedó sin comprobar está marcado.

---

## 0. Lo esencial en 25 puntos (para quien diseña el temario)

1. **Las hojas con errores son lo normal, no la excepción.** En 85 hojas reales inspeccionadas a fondo, el **94 %** tenía errores. En 14 estudios de laboratorio (967 personas), la tasa media de celdas con error fue del **3,9 %**. Con 100 celdas encadenadas y solo un 1 % de error por celda, la probabilidad de que el resultado final esté mal es del **63 %** (cálculo propio con la fórmula de Panko). [VERIFICADO: Panko 2015/2016]
2. **Revisar uno mismo no basta:** una persona sola encuentra de media el **60–63 %** de los errores; un equipo de tres, el **83 %**. La experiencia apenas reduce los errores pasados los 6 meses. Y todos nos creemos mejores de lo que somos (exceso de confianza). [VERIFICADO: Panko]
3. **Tres tipos de error**: mecánicos (pinchar la celda equivocada, teclear mal), lógicos (fórmula mal pensada) y **de omisión** (falta algo). Los de omisión son los más difíciles de ver. [VERIFICADO: Panko]
4. **Cada caso famoso enseña una regla concreta** (§1.3): JPMorgan (dividir por la suma en vez de la media, con copiar y pegar manual), Reinhart–Rogoff (rango que se queda corto), Public Health England (formato .xls de 65.536 filas), genes (Excel convierte texto en fechas), Barclays (filas ocultas), PSNI (hoja oculta con 9.483 nombres, multa de 750.000 £), Fidelity (signo menos perdido), Columbia Británica 2026 (fórmula arrastrada a celdas que no tocaba).
5. **Las reglas de construcción son de consenso** (FAST 02c, Código de Modelización Financiera del ICAEW de 2024, AQuA Book de 2025): separar **entradas, cálculos y salidas**; **ningún número escrito a mano dentro de una fórmula** si puede cambiar; **la misma fórmula en toda la fila o columna**; cada dato y cada cálculo **en un solo sitio**; **no ocultar** nada; **hoja de comprobaciones** con una **comprobación maestra** visible; hoja **Léeme**. [VERIFICADO]
6. **Colores:** no hay un único estándar. FAST usa **fuente azul para lo que llega de otra hoja** y roja para lo que sale; en banca se usa azul para entradas tecleadas; el ICAEW pide marcar las entradas **con relleno o borde, no solo con el color de la fuente**. La guía debe elegir uno (recomiendo los **estilos de celda de Excel**) y **poner siempre una leyenda**. [VERIFICADO: FAST, ICAEW]
7. **Proteger una hoja no es seguridad.** Microsoft lo dice literalmente: «La protección a nivel de hoja de cálculo no está pensada como característica de seguridad». Lo único que protege los datos es **cifrar el archivo con contraseña** y controlar quién tiene acceso. [VERIFICADO: support.microsoft.com]
8. **Ocultar no es proteger.** Filas, columnas y hojas ocultas, filtros activos, cachés de tablas dinámicas y modelos de datos **viajan con el archivo**. El Inspector de documento **detecta pero no quita** la caché de las tablas dinámicas, los vínculos externos ni los nombres ocultos. [VERIFICADO: Microsoft, ICO]
9. **Auditar es una destreza que se enseña**: Rastrear precedentes y dependientes, Mostrar fórmulas (Ctrl+`), Comprobación de errores (incluida «Fórmulas incoherentes con otras fórmulas de la región»), Evaluar fórmula, Ventana Inspección, Ir a > Especial y, en Microsoft 365 para empresas, Inquire y Comparar hojas de cálculo. [VERIFICADO]
10. **Rendimiento:** pocas funciones volátiles (AHORA, HOY, ALEATORIO.ENTRE, DESREF, INDIRECTO, CELDA, INFO), **tablas** en vez de columnas enteras en fórmulas matriciales, SUMAR.SI.CONJUNTO en vez de SUMAPRODUCTO, nada de vínculos entre libros si se puede evitar y vigilar el rango usado (Ctrl+Fin). [VERIFICADO: learn.microsoft.com]
11. **Colaborar es compartir un enlace, no adjuntar copias**: el archivo vive en OneDrive o SharePoint (los archivos de los canales de Teams están en SharePoint), con Autoguardado, coautoría, comentarios con @menciones e Historial de versiones. **Si dos personas cambian la misma celda, gana el último cambio guardado.** [VERIFICADO: Microsoft]
12. **Comentarios ≠ notas**: los comentarios son conversaciones (se responden, se resuelven y avisan por correo con @menciones). Las notas son anotaciones amarillas fijas. [VERIFICADO]
13. **Vínculos entre libros = riesgo**: se rompen al mover o cambiar el nombre del archivo, se quedan sin actualizar sin avisar y **romper un vínculo en el escritorio no se puede deshacer**. [VERIFICADO: Microsoft]
14. **RGPD en una hoja**: **minimización** (solo las columnas necesarias), **limitación del plazo de conservación**, **confidencialidad**, **seudonimización y cifrado** (art. 32). Las brechas se notifican a la AEPD **en un máximo de 72 horas** (art. 33). El deber de confidencialidad **sigue después de dejar el puesto** (LOPDGDD art. 5.3). [VERIFICADO: BOE]
15. **La AEPD multa casos «de Excel»**: 3.000 € a un gimnasio por enviar por correo un archivo con datos de 9.293 clientes; 35.000 € a una empresa por una hoja con nombre y DNI de 10.837 personas accesible por enlace; de 1.000 a 10.000 € por correos masivos sin copia oculta. [VERIFICADO-sec: Economist & Jurist]
16. **IVA en España**: tipos del **21 %, 10 % y 4 %** (y 0 % en casos concretos). **Se aplica el tipo vigente en la fecha de devengo** (art. 90.Dos LIVA), y en 2026 hubo un 10 % temporal en electricidad, gas y carburantes (del 22/03 al 31/05 o al 30/06/2026). Por eso **los tipos van en una tabla con fechas**, no dentro de las fórmulas. Recargo de equivalencia: **5,2 %, 1,4 %, 0,5 % y 1,75 %** (tabaco). [VERIFICADO: AEAT, BOE]
17. **Retención de IRPF en facturas de profesionales**: **15 %**, o **7 %** el año de inicio y los dos siguientes (si lo comunican por escrito). Alquileres de locales: **19 %**. Se calcula **sobre la base, sin IVA**: total = base + IVA − retención. [VERIFICADO: BOE, RD 439/2007]
18. **Factura completa**: número y serie correlativos (las **rectificativas en serie propia**), fecha, datos y NIF de las dos partes, descripción con precio unitario sin IVA, tipo, cuota por separado y fecha de la operación si es distinta. La factura simplificada (antes «ticket») vale hasta **400 €** con IVA (3.000 € en algunos sectores). [VERIFICADO: RD 1619/2012]
19. **VERI\*FACTU**: obligatorio desde el **1/1/2027** (sociedades) y el **1/7/2027** (resto), según el RDL 15/2025. **Una hoja de Excel que solo sirve para escribir, imprimir y guardar facturas no es un SIF**, pero **sí lo es si con macros genera los libros registro**. Además, no se puede mezclar la facturación a mano con un SIF. Hacienda anunció el 05/10/2026 una **«previsión de ampliación del plazo»** que no se pudo leer: **hay que comprobarla antes de publicar**. [VERIFICADO: AEAT]
20. **Factura electrónica obligatoria entre empresas** (RD 238/2026 y Orden HAC/1028/2026): desde el **6/10/2027** para quien facture más de 8 millones y desde el **6/10/2028** para el resto. Hay que comunicar la aceptación o el rechazo y **la fecha de pago efectivo**. Excel deja de servir para emitir facturas entre empresas, pero gana peso en el **análisis de cobros y plazos**. [VERIFICADO: AEAT, BOE]
21. **Nóminas 2026 (a grandes rasgos)**: contingencias comunes 28,30 % (23,60 % empresa y 4,70 % trabajador); desempleo indefinido 7,05 % (5,50 y 1,55); FOGASA 0,20 %; FP 0,70 % (0,60 y 0,10); MEI 0,90 % (0,75 y 0,15); base máxima **5.101,20 €/mes**. El coste para la empresa ronda el **bruto × 1,31 más accidentes de trabajo**. **La nómina se hace con software de nóminas**. Excel se usa para estimar, presupuestar y cuadrar. [VERIFICADO: seg-social.es, BOE]
22. **Importar es la mitad del trabajo**: CSV con `;`, **ANSI frente a UTF-8**, ceros a la izquierda que desaparecen, números como texto, fechas AAMMDD o al revés, y el **fichero bancario Norma 43** (líneas fijas de 80 caracteres, importes sin coma con 2 decimales implícitos). Excel trae opciones para **desactivar las conversiones automáticas** (Archivo > Opciones > Datos). [VERIFICADO: Microsoft, CaixaBank/AEB]
23. **La autonomía empieza antes de abrir Excel**: preguntar (para quién, para qué decisión, qué definición de cada cifra, de dónde salen los datos, para cuándo), escribirlo en una **especificación de una página** y llevar un **registro de supuestos y decisiones**. Es el método del AQuA Book (2025), que separa a quien encarga, a quien analiza, a quien revisa y a quien aprueba. [VERIFICADO: gov.uk]
24. **Nada se entrega sin**: cuadre con la fuente, comprobaciones en verde, casos límite probados, revisión por otra persona si el riesgo lo pide, Inspeccionar documento y **un resumen de una página con la conclusión primero**.
25. **Saber cuándo Excel ya no es la herramienta** (principio n.º 4 del ICAEW, «Determine if a spreadsheet is a suitable tool»): más de ~1 millón de filas (límite 1.048.576), muchas fuentes, muchas personas escribiendo a la vez, permisos por persona, auditoría obligatoria o procesos regulados (facturación). En esos casos, Power BI, una base de datos o una aplicación. [VERIFICADO: ICAEW, Microsoft]

---

## 1. Riesgo de las hojas de cálculo

### 1.1 Qué dicen los estudios (Raymond Panko, Universidad de Hawái, y EuSpRIG)

Fuente principal: Panko, R. R. «What We Don't Know About Spreadsheet Errors Today: The Facts, Why We Don't Believe Them, and What We Need to Do», *Proceedings of EuSpRIG 2015*, arXiv:1602.02601. [VERIFICADO: https://arxiv.org/pdf/1602.02601]

- **Tres conclusiones «unánimes»**: (1) los errores son raros por celda, pero en hojas grandes es **muy probable** que al menos un resultado final esté mal; (2) los errores son **muy difíciles de detectar**; (3) quien hace la hoja y las empresas tienen un **exceso de confianza** enorme en sus hojas.
- **Tasa de error por celda (CER)**: en 14 estudios de laboratorio con 967 personas trabajando solas, la media es del **3,9 %**. La investigación sobre el error humano predice entre el **1 % y el 5 %**. Como referencia, en programación (AT&T, 2,5 millones de líneas) la tasa es del 3,7 % por línea.
- **Hojas reales**: en 6 estudios de inspección intensiva (85 hojas, de 1995 a 2001: Hicks, Coopers & Lybrand, KPMG, Lukasic, Butler y Lawrence y Lee), el **94 %** tenía errores. Por estudio: Coopers & Lybrand, 91 % de 23 hojas; KPMG, 91 % de 22; Butler, 86 % de 7 (hojas que se presentaban con los impuestos en el Reino Unido); Lawrence y Lee, 100 % de 30. Las tasas por celda de esas inspecciones fueron del 1,2 %, 2,2 % y 2,5 %.
- **Tamaño real de las hojas**: en el corpus de Enron, 9.120 hojas con fórmulas sumaban **20.277.835 celdas con fórmula**. En dos organizaciones se encontraron 65.806 hojas en los servidores, con una media de más de 4.000 fórmulas cada una.
- **Detectar errores**: en 9 experimentos con más de 1.000 participantes, la media fue del **60 %** de los errores encontrados. En el estudio de Anderson (2004), con profesionales, la mitad de los errores se detectaron menos del 40 % de las veces y **nadie los encontró todos**. Con un método formal de inspección, una persona sola encontró el **63 %** y un equipo de tres, el **83 %**. Las herramientas automáticas de análisis estático solo encontraron el **27 %** de los errores sembrados (Anderson).
- **Tipos de error** (taxonomía de Panko y Halverson): en un experimento, el **45 %** fueron lógicos, el **23 %** mecánicos y el **31 %** de omisión. En Brown y Gould (1987), el 44 % de los modelos tenía errores sin contar las omisiones y el **63 %** contándolas.
- **Experiencia y estrés**: con menos de 6 meses de experiencia se cometen como mucho el doble de errores. Pasado ese tiempo, la mejora se estanca. El estrés alto multiplica los errores hasta por 5 o 10 (tabla de Swain y Guttman). **Trabajar con prisa no es excusa, es un factor de riesgo.**
- **Qué recomienda Panko**: muchas más pruebas, inspección en equipo (como en el software, con módulos pequeños, sesiones de 1 hora como máximo y 100 «líneas» por hora) y no fiarse de remedios sin datos que los respalden.
- Versiones antiguas de Panko (2000/2008) dan otras cifras (24 % en auditorías antiguas, 86 % u 88 % en las recientes). **La guía debe citar una sola: 94 % de 85 hojas (EuSpRIG 2015).** [VERIFICADO-sec: https://arxiv.org/pdf/0802.3457]

**Probabilidad de que el resultado final esté mal** (fórmula de Panko, P = 1 − (1 − CER)^n, con n celdas encadenadas; cálculo propio):

| Celdas en cadena | CER 1 % | CER 3,9 % | CER 5 % |
|---|---|---|---|
| 25 | 22 % | 63 % | 72 % |
| 100 | 63 % | 98 % | 99,4 % |

→ **Para la guía**: es una tarjeta de repaso perfecta y un ejercicio de la hoja en vivo: `=1-(1-B1)^B2`.

**EuSpRIG** (European Spreadsheet Risks Interest Group) mantiene la lista de «horror stories» en https://eusprig.org/research-info/horror-stories/: un centenar de casos de prensa recopilados por Patrick O'Beirne y otros colaboradores, cada uno con el riesgo y cómo se podría haber evitado; la entrada más reciente es de enero de 2024 [VERIFICADO: https://eusprig.org/research-info/horror-stories/].

### 1.2 Clasificación práctica para la alumna (síntesis propia, basada en Panko y Halverson)

| Tipo | Qué es | Ejemplo | Defensa en Excel |
|---|---|---|---|
| Mecánico | Pinchar la celda equivocada, teclear mal, pegar en la fila de al lado | `=SUMA(B2:B9)` cuando los datos llegan a B10 | Tablas (rangos que crecen solos), totales de control, Rastrear precedentes |
| Lógico | La fórmula hace otra cosa de la que se quería | Dividir por la suma en lugar de por la media | Desglosar en pasos, Evaluar fórmula, prueba con números fáciles |
| Omisión | Falta un elemento (un mes, un concepto, un signo) | No restar las devoluciones | Lista de requisitos, comprobaciones de cuadre, revisión por otra persona |
| De datos de entrada | El dato llega mal o Excel lo transforma | «MARCH1» → 1-mar; «00123» → 123 | Importar con Power Query, tipo Texto, opciones de conversión automática |
| De entorno o formato | El archivo, el formato o el proceso pierden información | .xls que corta a 65.536 filas; hoja oculta que se publica | Formato correcto, recuento de filas de entrada y salida, Inspeccionar documento |

### 1.3 Casos famosos: qué pasó, cifras y la lección práctica

| Año | Organización | Qué pasó (mecanismo) | Cifras | Lección práctica para la guía | Fuente |
|---|---|---|---|---|---|
| 1994 | Fidelity Magellan (fondo de inversión, EE. UU.) | Una pérdida neta de capital de 1.300 M$ se anotó **sin el signo menos** en una hoja de cálculo aparte y contó como ganancia | Error de 2.600 M$ en la estimación. El dividendo anunciado de 4,32 $ por participación se canceló | **Convención de signos clara y escrita**; comprobación de razonabilidad («¿tiene sentido repartir esto en un año malo?») | El error de cálculo y la cancelación: [VERIFICADO-sec: https://www.deseret.com/1994/12/7/19146703/fidelity-says-calculation-error-means-no-dividend-for-investors]. El signo menos y los 2.600 M$: carta del presidente de Fidelity, J. Gary Burkhead, a los partícipes, citada literalmente en RISKS Digest 16.72 (04/01/1995) [VERIFICADO: https://catless.ncl.ac.uk/Risks/16/72] y en EuSpRIG |
| 2003 | TransAlta (eléctrica, Canadá) | Error de **cortar y pegar** en una hoja de pujas: filas desalineadas al ordenar y clasificar, y compró más contratos de cobertura y más caros de lo previsto | 24 M$ (antes de impuestos) | **Nunca ordenar solo una columna**; usar Tablas; comprobar los totales después de ordenar o pegar | [VERIFICADO-sec: https://www.theregister.com/content/67/31298.html · https://www.petroleumnews.com/pnarchpop/490715843.shtml] |
| 2005 | Kodak | Una hoja de cálculo con **ceros de más** en la indemnización por despido de un empleado (cierre de una planta en el Reino Unido). Era una provisión: no llegó a pagarse | Provisión inflada en 11 M$ (neto de impuestos); Kodak rehízo sus cuentas del 2.º trimestre de 2005 y lo declaró «debilidad material» de su control interno | **Validación de datos** (máximos razonables), comprobaciones de valores atípicos; revisar siempre las hojas con fórmulas nuevas o cambiadas | [VERIFICADO: https://www.sec.gov/Archives/edgar/data/31235/000120677405001993/ek109811.htm] (informe 10-Q/A de Kodak ante la SEC). Lo de los «ceros de más» lo dijo un portavoz de Kodak a MarketWatch, citado en [VERIFICADO-sec: https://eusprig.org/research-info/horror-stories/] |
| 2008 | Barclays / Lehman Brothers | En la lista de contratos de la compra había **filas ocultas** con 179 contratos marcados con «N» (no incluir). Al reformatear y convertir a PDF para el juzgado, las filas reaparecieron y la marca se perdió | ~1.000 filas, más de 24.000 celdas; 179 contratos no deseados | **Ocultar no es borrar.** Antes de publicar: mostrar todo, filtrar por la marca, **quitar lo que no va** y entregar valores en un libro nuevo | [VERIFICADO-sec: https://www.finextra.com/newsarticle/19135/excel-error-leaves-barclays-with-unwanted-lehman-assets · https://abajournal.com/news/article/excel_error_by_a_cleary_gottlieb_associate_alters_lehman_asset_deal1] |
| 2010–2013 | Reinhart y Rogoff, «Growth in a Time of Debt» | El PROMEDIO de la hoja **no incluía las 5 últimas filas** (Australia, Austria, Bélgica, Canadá y Dinamarca). Herndon, Ash y Pollin (2013) lo descubrieron al pedir la hoja | Crecimiento medio con deuda > 90 % del PIB: −0,1 % según el artículo y **+2,2 %** corregido. También había otros problemas de método | **Pedir y revisar la hoja, no solo el resultado**; usar Tablas para que los rangos no se queden cortos; Comprobación de errores («fórmulas que omiten celdas en una región») | [VERIFICADO-sec: https://retractionwatch.com/2013/04/18/influential-reinhart-rogoff-economics-paper-suffers-database-error/ · https://blogs.lse.ac.uk/politicsandpolicy/public-debt-gdp-growth-and-austerity-why-reinhart-and-rogoff-are-wrong] |
| 2010 (informe de 2011) | MI5 (Reino Unido) | Un fallo de formato en una hoja de cálculo cambió los 3 últimos dígitos de números de teléfono por «000» | Se pidieron y obtuvieron por error los **datos del titular** de 134 números que no tenían nada que ver con ninguna investigación (no eran escuchas). Los datos se destruyeron y desde entonces los números se comprueban a mano | **Los números largos y los códigos son texto** (teléfonos, IBAN, cuentas) | [CORREGIDO: https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/247324/1239.pdf] (informe anual de 2010 del Interception of Communications Commissioner, HC 1239, párr. 7.33) |
| 2012 | JPMorgan Chase («London Whale») | El nuevo modelo de VaR funcionaba con **hojas de Excel actualizadas a mano copiando y pegando**. Una fórmula restaba la tasa antigua de la nueva y **dividía por su suma en vez de por su media**. Eso reducía la volatilidad a la mitad y bajaba el VaR | Pérdidas de ~6.200 M$ en la cartera de la CIO | Probar con **números fáciles de calcular a mano**; **eliminar el copiar y pegar manual** (Power Query); revisión independiente de los modelos críticos | [VERIFICADO-sec: https://www.r-bloggers.com/did-an-excel-error-bring-down-the-london-whale/ · https://www.ifre.com/story/1744757/derivatives-jpm-report-unveils-var-errors]. El informe del grupo de trabajo (16/01/2013) no se pudo descargar |
| 2012 | Departamento de Transporte del Reino Unido (franquicia West Coast Main Line) | Fallos en el modelo financiero hecho con hojas de cálculo y en el dimensionado de un préstamo subordinado, con un equipo junior y roles poco claros. Se anuló la adjudicación | Coste para el contribuyente de **al menos 50 M£**, según el Comité de Cuentas Públicas de los Comunes (28/02/2013), que avisó de que el coste final sería «mucho mayor» [VERIFICADO: https://www.pinsentmasons.com/out-law/news/failed-west-coast-franchise-competition-will-cost-taxpayers-50m-says-public-accounts-committee]; en diciembre de 2012 la NAO aún no conocía el coste total [VERIFICADO: https://www.nao.org.uk/wp-content/uploads/2012/12/1213796.pdf]. Dio lugar a la revisión Macpherson (2013) y al **AQuA Book** | **Roles claros** (quien encarga, quien hace, quien revisa); garantía de calidad proporcional al riesgo | [VERIFICADO-sec: https://www.gov.uk/government/news/west-coast-main-line-final-report-of-the-laidlaw-inquiry]. Origen del AQuA en la revisión Macpherson: [VERIFICADO: https://best-practice-and-impact.github.io/aqua_book_revision] |
| 2016–2021 | Genética (artículos científicos) | Excel convierte nombres de genes en fechas (SEPT2 → 2-sep; MARCH1 → 1-mar) o en números en notación científica | En 2021, el **30,9 %** de los artículos con listas de genes en Excel tenía errores (3.436 de 11.117, de 2014 a 2020). En 2020 el HGNC cambió los nombres (SEPT1 → SEPTIN1, MARCH1 → MARCHF1) | **Importar como texto** (Power Query, Asistente) y **revisar las conversiones automáticas**; ordenar la columna para que «salten» las fechas | [VERIFICADO: https://pmc.ncbi.nlm.nih.gov/articles/PMC8357140] |
| 2016 | Lazard (fusión Tesla–SolarCity) | En las hojas de SolarCity que usó Lazard para su descuento de flujos, un error de cálculo **contó dos veces** 400 M$ de deuda prevista (de su línea de crédito) | Deuda de 3.793 M$ en lugar de 3.393 M$, así que el valor quedó infravalorado en ~400 M$. No cambió ni la opinión de Lazard ni el precio | **Calcular una sola vez** cada partida y enlazar a ella | [VERIFICADO: https://www.sec.gov/Archives/edgar/data/1318605/000119312516697498/d241192ds4.htm] (formulario S-4 de Tesla ante la SEC, 31/08/2016) |
| 2019 | NHS Lothian (Hospital Infantil de Edimburgo) | Al **copiar** los criterios de ventilación de una habitación de 4 camas a la UCI, la hoja de 2012 decía **4 renovaciones de aire por hora en vez de 10** | Apertura retrasada más de un año; ~16 M£ en arreglos | Las **especificaciones copiadas** se revisan contra la norma; dejar **rastro de la fuente** de cada dato | [VERIFICADO-sec: https://www.scotsman.com/health/edinburgh-royal-hospital-for-sick-children-report-finds-spreadsheet-error-led-to-ps16-million-opening-delay-2953046 · https://audit.scot/uploads/docs/report/2019/s22_191218_nhs_lothian_pr.pdf] |
| 2020 | Public Health England (COVID-19) | Los resultados llegaban en CSV y se cargaban con un proceso automático en plantillas de **formato .xls (Excel 97-2003), con un límite de 65.536 filas**. Lo que no cabía se perdía sin avisar | **15.841 positivos** sin contar (del 25/09 al 02/10/2020); hasta ~48.000 contactos sin rastrear a tiempo | **Contar filas al entrar y al salir** (totales de control); usar .xlsx o una base de datos; **no es el límite de 1 millón de filas** (error frecuente, incluso en Wikipedia) | [VERIFICADO-sec: https://www.digitalhealth.net/2020/10/it-error-left-thousands-of-covid-19-cases-missed-in-daily-figures/ · https://ukauthority.com/articles/phe-confirms-file-size-issue-caused-covid-19-undercounting/]. Las 65.536 filas: BBC, citada por otros medios |
| 2021 | Crypto.com (Australia) | Al hacer un reembolso se tecleó un número de cuenta en el campo del importe | Unos 10,5 millones de **dólares australianos** (unos 7,2 M$ de EE. UU.) transferidos en lugar de 100 dólares australianos; la empresa no se dio cuenta hasta siete meses después | **Validación de datos** y doble control en pagos | [CORREGIDO: https://www.theregister.com/2022/08/31/crypto_dotcom_australia_refund/] (cita los documentos del Tribunal Supremo de Victoria) |
| 2022–2025 | Ministerio de Defensa del Reino Unido (afganos) | Un empleado envió fuera de los sistemas autorizados una hoja de Excel con los datos de quienes pedían reubicación | **18.714 personas** expuestas; orden judicial de silencio hasta julio de 2025; miles de personas reubicadas | **No enviar hojas con datos personales por correo**; compartir solo lo necesario; las guías del ICO de 2025 nacen de este caso | [VERIFICADO-sec: https://www.civilserviceworld.com/professions/article/mod-afghan-data-breach-arap-arr-ico] |
| 2023 | Policía de Irlanda del Norte (PSNI) | En la respuesta a una solicitud de transparencia se publicó una hoja con una **pestaña oculta** con apellido, inicial, rango y puesto de **toda la plantilla**. Varias personas revisaron el archivo y nadie vio la pestaña | **9.483 personas**; multa del ICO de **750.000 £** (habría sido de 5,6 M£ sin el criterio aplicado al sector público) | **Mostrar todas las hojas e Inspeccionar documento antes de enviar**; publicar en un formato simple (CSV o PDF) y no la hoja original | [VERIFICADO: https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/05/psni-facing-a-750k-fine-following-spreadsheet-error-that-exposed-the-personal-information-of-its-entire-workforce/] |
| 2026 | Gobierno de la Columbia Británica (Canadá) | Cuatro errores humanos en la previsión de ingresos por el gas. Según los responsables, el mayor fue una **fórmula arrastrada a celdas a las que no correspondía** y otro una **confusión entre dólares de EE. UU. y canadienses** | Sobreestimación de **1.460 M$** en 5 años; déficit previsto 450 M$ mayor | **Unidades y moneda en cada fila**; comprobar al arrastrar fórmulas (Comprobación de errores); revisión independiente de los presupuestos | [VERIFICADO-sec: https://globalnews.ca/news/12044918/bc-gas-revenue-forecast-errors/ · https://www.ctvnews.ca/vancouver/article/bc-confirms-146b-in-gas-revenue-forecast-errors/ (01/09/2026)] |
| 2012 y 2025 | Casos de la AEPD (España) | Gimnasio que envió por correo, a 334 destinatarios, un archivo adjunto con los datos de sus clientes (2012, con la antigua LOPD: deber de secreto); empresa cuya hoja de candidatos (respuestas de un formulario) era **accesible para cualquiera con el enlace** e incluía a quienes no habían dado su consentimiento (2025, RGPD) | 3.000 € (9.293 clientes) y **35.000 €** (nombre y DNI de 10.837 personas, art. 5.1.f RGPD, 12/06/2025) | **Enlaces «solo personas concretas»**, revisar permisos y plazos de conservación; no adjuntar listados de clientes a los correos | [VERIFICADO-sec: https://www.economistjurist.es/?p=229395]. Gimnasio: [CORREGIDO: https://www.legaltoday.com/practica-juridica/derecho-publico/proteccion-datos/multa-de-3000-euros-a-un-gimnasio-por-enviar-correo-electronico-con-datos-de-9293-clientes-2012-06-25/] (el caso es de 2012, no de 2024–2025; no se ha localizado la resolución en aepd.es) |

**Aviso de rigor para la guía**: la mayoría de los casos antiguos solo están documentados en prensa. Conviene presentarlos como «según la prensa de la época» y no inventar detalles (p. ej., la letra exacta de la celda en Reinhart–Rogoff).

### 1.4 Las lecciones convertidas en 12 reglas de oro (para tarjetas de repaso y test)

1. **Escribe el dato una vez y enlázalo** (Lazard, FAST 1.01-07 «Calculate only once»).
2. **Ningún número que pueda cambiar dentro de una fórmula** (IVA, retenciones, tipos de cambio).
3. **Usa Tablas** para que los rangos crezcan solos (Reinhart–Rogoff, PHE).
4. **Cuenta filas e importes al entrar y al salir** (PHE: 15.841 casos perdidos sin aviso).
5. **Prueba la fórmula con números que puedas calcular de cabeza** (JPMorgan: suma frente a media).
6. **Pon unidades, moneda y signo en cada fila** (Columbia Británica, Fidelity).
7. **Los códigos son texto**: CP, NIF, IBAN, teléfonos, cuentas contables, referencias (MI5, genes).
8. **Nunca ordenes una sola columna** de una lista (TransAlta).
9. **Ocultar no es borrar ni proteger** (Barclays, PSNI).
10. **Lo que importa lo revisa otra persona** (Panko: 63 % frente a 83 %; West Coast; AQuA).
11. **Antes de enviar fuera: mostrar todo, Inspeccionar documento y pensar si hace falta enviar el archivo o basta un PDF o un CSV con lo justo** (PSNI, MoD, AEPD).
12. **Si se copia y pega a mano cada mes, se acabará pegando mal**: automatiza con Power Query (JPMorgan, TransAlta).

### 1.5 Ejercicios «caza el error» reproducibles en la hoja en vivo (HyperFormula esES)

- **Reinhart–Rogoff mini**: 10 países con crecimiento; la fórmula `=PROMEDIO(B2:B6)` deja fuera de B7 a B11. Pregunta: «¿Por qué no coincide con el total del informe?». Solución: convertir en Tabla o `=PROMEDIO(B2:B11)`, y comprobación `=CONTAR(B2:B11)=CONTARA(A2:A11)`.
- **JPMorgan mini**: tasa antigua 0,04 y nueva 0,06; la fórmula `=(B2-B1)/(B1+B2)` da 0,2 y la pensada `=(B2-B1)/PROMEDIO(B1:B2)` da 0,4 (el doble). Lección: probar con números redondos.
- **Fidelity mini**: lista de ganancias y pérdidas con una pérdida escrita en positivo; comprobación de signo `=SI(Y(C5="Pérdida";D5>0);"REVISAR SIGNO";"")`.
- **PHE mini** (con un .xlsx descargable): un CSV de 70.000 filas «cargado» en una plantilla que corta a 65.536 filas. Comprobación: `=CONTARA(Datos!A:A)-1` frente al número de filas que dice el sistema de origen.
- **Genes y códigos** (.xlsx): un CSV con «MARCH1», «SEPT2», «00123», «1-2» y un IBAN. Se abre con doble clic (se estropea) y después con Datos > Desde texto/CSV con tipo Texto (se conserva).
- **PSNI mini** (.xlsx): libro «para publicar» con una hoja oculta con DNI, una tabla dinámica cuya caché guarda los datos de origen y un filtro activo. Tarea: encontrar los tres problemas con Inspeccionar documento y Mostrar hojas.

---

## 2. Estándares y buenas prácticas de construcción

### 2.1 Los marcos de referencia (qué son y qué edición está vigente)

| Marco | Quién | Edición vigente | Para qué sirve en la guía | Fuente |
|---|---|---|---|---|
| **FAST Standard** (*Flexible, Appropriate, Structured, Transparent*) | FAST Standard Organisation | **02c, julio de 2019**, la última edición que se ha podido consultar (la web oficial fast-standard.org no abre desde aquí, así que no se puede descartar una posterior) [NO VERIFICABLE: no enseñarlo como dato] | Reglas muy concretas y numeradas (p. ej., FAST 3.03-01 «Do not write a formula longer than your thumb») | [VERIFICADO: copia del PDF oficial https://www.stl-training.co.uk/download/forum/40296_FAST-Standard-02c-July-2019.pdf] |
| **Financial Modelling Code** | ICAEW (Excel Community) | **© ICAEW 2024 (08/24)**. Salió de comparar 7 metodologías con más de una docena de organizaciones | Principios con recomendaciones y prácticas desaconsejadas; «no es una lista de casillas» | [VERIFICADO: https://www.icaew.com/-/media/corporate/files/technical/technology/excel-community/financial-modelling-code.ashx] |
| **Twenty principles for good spreadsheet practice** | ICAEW | **4.ª edición, 21/05/2024** (la primera es de 2013; la anterior, de 2018). Es la base del Código, que cita sus números | Principios generales para cualquier hoja | Lista completa [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/20-principles-for-good-spreadsheet-practice-2024-edition]; edición [VERIFICADO: https://www.icaew.com/insights/viewpoints-on-the-news/2024/may-2024/updated-20-principles-for-good-spreadsheet-practice]; números citados en el Código [VERIFICADO] |
| **Spreadsheet Competency Framework, 2.ª ed.** | ICAEW | 02/07/2026 | Niveles Basic, General, Creator y Developer | Ver `curriculo.md` §4.2 [VERIFICADO allí] |
| **AQuA Book** (*Analytical Quality Assurance*) | HM Treasury y Government Analysis Function (Reino Unido) | **Edición revisada de 2025, publicada el 30/07/2025** (la anterior es de 2015) | Roles, ciclo del análisis, especificación, registros de supuestos y decisiones, verificación y validación | [VERIFICADO: https://www.gov.uk/government/publications/the-aqua-book-guidance-on-producing-quality-analysis-for-government] |

**Principios del ICAEW citados en el Código** (numeración oficial; textos literales en inglés) [VERIFICADO: Código del ICAEW]:
#4 *Determine if a spreadsheet is a suitable tool* · #5 *Focus on the purposes of the spreadsheet* · #7 *Make the spreadsheet easy to use, providing supporting guidance where helpful* · #8 *Design with adaptability in mind to minimise future manual intervention* · #9 *Structure workbooks with a clear flow of inputs, processes, and outputs* · #11 *Structure worksheets to avoid inconsistent logic and layout* · #12 *Keep formulas consistent across ranges* · #13 *Use the simplest features, functions, or formulas for the task* · #14 *Avoid using fixed values within formulas* · #15 *Refer to existing calculated results instead of reperforming the calculation* · #17 *Build in checks, controls, and alerts from the outset* · #18 *Test and review to reduce the risk of error and identify inefficiencies* · #20 *Manage access levels and protection to reduce the risk of accidental or malicious changes*. (Los que el Código no cita, según la lista oficial de la 4.ª edición, 2024: #1 *Determine how much your organisation depends on spreadsheets and plan your approach and processes accordingly* · #2 *Adopt a consistent methodology for spreadsheets in your organisation* · #3 *Ensure designers and users of spreadsheets have appropriate knowledge, competence, experience, and awareness of functionality* · #6 *Tailor the design and documentation to the needs of the audience and dependent processes* · #10 *Seek to control, clean, and optimise data quality and structure prior to using them* · #16 *Collaborate in design and review processes* · #19 *Ensure there is a regular process of backup and version control* [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/20-principles-for-good-spreadsheet-practice-2024-edition].)

### 2.2 Las reglas de consenso, explicadas para Excel en español

**A. Estructura del libro: entradas → cálculos → salidas**
- ICAEW: «Segregate inputs (assumptions), calculations and outputs (results), either by using separate worksheets, or demarcated sections on the same worksheet». Lógica que se lee «como un libro»: de arriba abajo y de izquierda a derecha, también entre hojas; **el tiempo en horizontal**; una sola línea de tiempo por hoja. [VERIFICADO: ICAEW]
- FAST: hojas ordenadas para que el cálculo vaya de izquierda a derecha (1.02-01); **no partir un modelo en varios libros** (1.03-01); evitar los vínculos externos (1.03-02); «Each column should have a single and consistent purpose» (2.01-01); **«Do not hide anything»** (2.01-08). [VERIFICADO: FAST 02c]
- **Plantilla de hojas recomendada para la guía** (síntesis propia):

| Hoja | Contenido | Color de pestaña (propuesta) |
|---|---|---|
| `Léeme` | Propósito, para quién, autor, fecha, versión, fuentes, cómo se actualiza, supuestos clave, limitaciones, leyenda de colores, registro de cambios | Gris |
| `Entradas` (o `Supuestos`) | Parámetros: tipos de IVA con fechas, objetivos, fecha de corte, tipos de cambio | Amarillo |
| `Datos` | Datos en bruto tal como llegan (Power Query o pegado), **sin tocar**, en Tabla | Azul |
| `Cálculos` | Columnas auxiliares, tablas intermedias | Sin color |
| `Informe` o `Panel` | Lo que ve la dirección | Verde |
| `Comprobaciones` | Todos los controles y la comprobación maestra | Rojo |

**B. Ningún número escrito a mano dentro de las fórmulas («hardcoding»)**
- ICAEW: «hardcoding should never be used for values that could foreseeably change during the life of the model». Se admiten constantes evidentes (12 meses, 24 horas), pero no un tipo impositivo. FAST 3.04-01: «Do not write formulas with embedded constants». [VERIFICADO]
- Mal: `=B2*0,21`. Bien: `=B2*TipoIVAGeneral` (nombre definido) o `=[@Base]*[@TipoIVA]` (columna de una Tabla), con el tipo en `Entradas`.
- Una **entrada en un solo sitio** (ICAEW #15, FAST 1.01-07): si el 21 % aparece en tres celdas, alguien cambiará solo dos.
- Un reparto que debe sumar el 100 % se construye con la última parte calculada (ICAEW): `=1-SUMA(B2:B4)`.

**C. Fórmulas consistentes**
- ICAEW #12: «Make formulas strictly consistent across formula blocks, so the formula can be copied and pasted across the block»; si una fórmula es distinta por un buen motivo, **que se vea** (formato o nota). FAST 3.02-01: «Formulas must be consistent». [VERIFICADO]
- Excel lo vigila: la regla de Comprobación de errores **«Fórmulas incoherentes con otras fórmulas de la región»** marca la celda con un triángulo verde. En las Tablas, **«Fórmula de columna calculada incoherente en las tablas»**. [VERIFICADO: https://support.microsoft.com/es-es/excel/detect-formula-errors-in-excel]
- Fórmulas cortas: «rule of thumb» (no más larga que el pulgar sobre la barra de fórmulas), «rule of seconds» (**que se explique en menos de 24 segundos**), sin fórmulas de varias líneas, **sin SI anidados** (FAST 3.03-07; mejor una tabla de tramos con BUSCARV aproximado o BUSCARX) y evitar DESREF e INDIRECTO (FAST 4.01-03), porque sus dependencias no se ven con las flechas de rastreo. [VERIFICADO: FAST]
- ICAEW: «Break complex calculations into multiple stages», «Don't leave calculations set to manual» y redondear **solo la salida**, nunca con «Establecer precisión de pantalla». [VERIFICADO]

**D. Unidades, signos y etiquetas**
- Cada fila con su unidad (€, miles de €, uds., %), y si es anual o mensual. Convención de signos única y escrita (p. ej., ingresos +, gastos −, o «todo en positivo» con la etiqueta «Gastos»). ICAEW desaconseja la convención contable pura (debe +, haber −) en los modelos. [VERIFICADO: ICAEW]
- Nombres de hoja claros, sin operadores (`Ventas-2026` puede confundir dentro de una fórmula; mejor `Ventas_2026`) [VERIFICADO: ICAEW «Don't use mathematical operators in worksheet names»].
- No combinar celdas (FAST 4.02-01 «Do not merge cells»): mejor **Centrar en la selección**. [VERIFICADO: FAST]

**E. Comprobaciones (controles) y comprobación maestra**
- ICAEW: comprobación de igualdad para todo lo que se calcula por dos caminos; **tolerancia** para los redondeos; formato condicional en las comprobaciones; **«Build a dedicated check summary section»** y mostrar el resultado de la comprobación maestra en el panel inmovilizado de todas las hojas. FAST 2.03-05 dice lo mismo. [VERIFICADO]
- Fórmulas tipo (es-ES):
  - Cuadre: `=SI(ABS(Informe!F20-SUMA(Datos[Importe]))<=0,01;"OK";"ERROR")`
  - Recuento: `=SI(FILAS(Datos[Importe])=Entradas!B5;"OK";"ERROR")` (B5 = filas que dice el ERP)
  - Vacíos obligatorios: `=SI(CONTAR.BLANCO(Datos[Cliente])=0;"OK";"ERROR")`
  - Duplicados de factura: `=SI(SUMAPRODUCTO((CONTAR.SI(Datos[NumFactura];Datos[NumFactura])>1)*1)=0;"OK";"ERROR")`
  - Maestra: `=SI(CONTAR.SI(Comprobaciones!D:D;"ERROR")=0;"TODO CUADRA";"REVISAR: "&CONTAR.SI(Comprobaciones!D:D;"ERROR")&" errores")`
- Diferenciar **comprobaciones** (errores del modelo) de **alertas** de negocio (un cliente pasa de 90 días). ICAEW las distingue. [VERIFICADO]

**F. Hoja «Léeme» (documentación dentro del libro)**
- ICAEW: «Include in the model a worksheet dedicated to being a user guide» y «Don't store documentation in a separate file or email that may become separated from the model». FAST 2.05-02: el modelo debe explicar cómo funciona sin ayuda externa; 2.06-01, índice; 2.06-02, **lista de limitaciones y debilidades**. [VERIFICADO]
- Contenido mínimo (propuesta): título; objetivo y pregunta de negocio; destinatario; responsable y suplente; fecha y versión; fuentes de datos (sistema, informe, fecha de extracción, persona de contacto); cómo actualizarlo, paso a paso; supuestos; limitaciones; leyenda de colores; índice con hipervínculos; registro de cambios (fecha, quién, qué y por qué).

**G. Convenciones de color (no hay un estándar único: elegir uno y ponerlo en la leyenda)**
- FAST 1.01-06: «Mark exports with red font and imports with blue font». Habla de lo que **sale de la hoja o llega a ella**, no de las entradas. [VERIFICADO: FAST]
- ICAEW: «Distinguish input cells from other cell types using a defined cell fill colour and/or a cell border, not just a defined font colour»; «Use Excel Styles»; «Include a formatting key». [VERIFICADO]
- Costumbre en banca y consultoría: azul = dato escrito a mano, negro = fórmula, verde = enlace a otra hoja. Es una práctica extendida, no una norma, y el verde no lo usa todo el mundo (muchos modelos dejan esos enlaces en negro) [VERIFICADO: https://www.fe.training/free-resources/financial-modeling/financial-model-formatting-numbers/].
- **Recomendación para la guía**: usar los **estilos de celda integrados** (Inicio > Estilos de celda: «Entrada», «Cálculo», «Salida», «Celda de comprobación», «Celda vinculada», «Notas», «Texto de advertencia», «Texto explicativo») [ruta: VERIFICADO: https://support.microsoft.com/es-es/office/aplicar-crear-o-quitar-un-estilo-de-celda-472213bf-66bd-40c8-815c-594f0f90cd22; nombres en español: CORREGIDO: https://binaries.templates.cdn.office.net/support/templates/es-es/tf16400962_win32.xltx (plantilla oficial de Microsoft en español: el estilo se llama «Notas», en plural, no «Nota»)], más una leyenda en `Léeme`. Así cumple el ICAEW (relleno y no solo fuente) y lo reconoce cualquiera.

**H. Nombres de archivo y versiones**
- Problema: «presupuesto_final_v2_BUENO_revJuan.xlsx». FAST y el ICAEW piden **un solo libro** («to avoid version control risks presented by multiple workbooks»). AQuA pide control de versiones: qué cambió, por qué, cuándo y quién. [VERIFICADO]
- Propuesta: `AAAA-MM-DD_Proyecto_Contenido_vNN.xlsx` (p. ej., `2026-11-14_Ventas-Q3_InformeDireccion_v03.xlsx`). La fecha en formato ISO para que se ordene bien; sin espacios ni tildes si se va a enviar a sistemas externos [convención propia].
- En OneDrive o SharePoint **no se hacen copias**: se usa el **Historial de versiones** (Windows: Archivo > Información > Historial de versiones) y, para marcar una entrega, se guarda una copia en PDF o una copia «congelada» en una carpeta `Entregas`. [VERIFICADO: página de coautoría de Microsoft]

**I. Tablas estructuradas**
- Microsoft recomienda las referencias estructuradas porque **se amplían y reducen solas**, tienen menos problemas de rendimiento que las columnas enteras o los rangos dinámicos y permiten varias tablas en una misma hoja. [VERIFICADO: https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-tips-for-optimizing-performance-obstructions]
- Reglas: una fila = un registro; una columna = un campo con un solo tipo de dato; encabezados únicos; sin filas ni columnas en blanco; sin subtotales dentro; nombre de tabla con sentido (`tblVentas`, `Ventas`).

**J. Validación de datos**
- ICAEW: usarla para reducir datos no válidos (listas desplegables, intervalos); con **mensaje de entrada** y mensaje de error que explique qué se admite; **sin abusar**. [VERIFICADO]
- Ejemplos de empresa: lista de tipos de IVA (`=TiposIVA[Código]`), fecha dentro del ejercicio (entre 01/01/2026 y 31/12/2026), importe > 0 en ventas y < 0 en abonos, NIF de 9 caracteres (`=LARGO(A2)=9`), empleado que existe en el maestro.
- Límite: la validación **no impide pegar** datos que no la cumplen (Microsoft: los mensajes no aparecen si los datos se copian o se rellenan, ni si los calcula una fórmula o los escribe una macro); hay que comprobarlo con Datos > Herramientas de datos > flecha de **Validación de datos** > «Rodear con un círculo datos no válidos» (la ayuda de Microsoft en español lo traduce como «Círculo con datos no válidos»; los círculos se quitan con «Borrar círculos de validación»; solo en Excel de escritorio, no en la web) [CORREGIDO: https://support.microsoft.com/es-es/excel/display-or-hide-circles-around-invalid-data] o con una comprobación.

**K. Protección (y por qué no es seguridad)**
- Tres niveles [VERIFICADO: https://support.microsoft.com/es-es/excel/protection-and-security-in-excel y https://support.microsoft.com/es-es/office/proteger-una-hoja-de-c%C3%A1lculo-3179efdb-1285-4d49-a9c3-f4ca36276de6]:
  - **Archivo**: Archivo > Información > Proteger libro > **Cifrar con contraseña** (contraseña de apertura). «Microsoft no puede recuperar contraseñas olvidadas». Distingue mayúsculas y minúsculas. Es la protección que de verdad impide leer el archivo.
  - **Libro (estructura)**: impide agregar, mover, ocultar o eliminar hojas.
  - **Hoja**: dos pasos. (1) Desbloquear las celdas de entrada (Ctrl+1 > Proteger > quitar «Bloqueada»); (2) Revisar > **Proteger hoja**, marcando lo que se permite (ordenar, Autofiltro…). En Excel para la web: Revisar > **Administrar protección**, con «Rangos desbloqueados» y «Protección en pausa».
  - Cita literal: **«La protección a nivel de hoja de cálculo no está pensada como característica de seguridad.»** Y sigue: «Simplemente impide que los usuarios modifiquen las celdas bloqueadas de la hoja de cálculo». Sirve para evitar errores, no para guardar secretos; para que nadie lea los datos, Cifrar con contraseña [VERIFICADO: https://support.microsoft.com/es-es/excel/protection-and-security-in-excel]. (Lo de «hay programas que la quitan en segundos» [NO VERIFICABLE: no enseñarlo como dato].)
- Microsoft recomienda contraseñas de al menos 8 caracteres o, mejor, frases de 14 o más. [VERIFICADO]
- El ICO desaconseja expresamente usar contraseñas que solo impiden editar en lugar de contraseñas de apertura fuertes. [VERIFICADO: lista del ICO, §4.4]
- Regla de la guía: **la contraseña nunca va en el mismo correo que el archivo** (enviarla por otro canal: teléfono, SMS o un mensaje aparte). Microsoft lo indica para los vínculos con contraseña de OneDrive y SharePoint: «Deberá proporcionar esta contraseña por separado a cualquier persona con la que quiera compartir el archivo» [VERIFICADO: https://support.microsoft.com/es-es/onedrive/share-files-and-folders-in-microsoft-onedrive]. No se encontró una fuente oficial española que lo diga expresamente.

**L. Auditoría de fórmulas (Fórmulas > Auditoría de fórmulas)**
- **Rastrear precedentes** y **Rastrear dependientes** dibujan flechas: **azules** = sin errores, **rojas** = celdas que provocan errores, **negras con icono de hoja** = otra hoja u otro libro (que debe estar abierto). **Quitar flechas**. [VERIFICADO: https://support.microsoft.com/es-ES/Excel/display-the-relationships-between-formulas-and-cells]
- **Mostrar fórmulas**: Ctrl+` (acento grave). [VERIFICADO: lista de atajos en `work/atajos_es.txt`]
- **Comprobación de errores**: Archivo > Opciones > Fórmulas > «Habilitar comprobación de errores en segundo plano». Reglas: fórmulas con error; columna calculada incoherente en tablas; años con 2 dígitos; **números con formato de texto o precedidos por un apóstrofo**; **fórmulas incoherentes con otras de la región**; **fórmulas que omiten celdas en una región**; celdas desbloqueadas con fórmulas… [VERIFICADO: https://support.microsoft.com/es-es/excel/detect-formula-errors-in-excel]
- **Evaluar fórmula**: Fórmulas > Auditoría de fórmulas > Evaluar fórmula; con «Paso a paso para entrar» se sigue a otra celda. [VERIFICADO: misma página]
- **Ventana Inspección**: Auditoría de fórmulas > Ventana Inspección > Agregar inspección. Sirve para vigilar celdas clave (totales, comprobación maestra) mientras se trabaja en otra hoja. [VERIFICADO: misma página]
- **Ir a Especial** (F5 > Especial, o Inicio > Buscar y seleccionar > Ir a Especial): Constantes, Fórmulas, celdas en blanco (la ayuda de Microsoft lo llama «Espacios en blanco»), Diferencias entre filas, Diferencias entre columnas, Última celda y Solo celdas visibles. Para encontrar números tecleados en una zona de fórmulas. [F5 VERIFICADO en la lista de atajos; nombres de las opciones CORREGIDO: https://support.microsoft.com/es-es/excel/find-and-select-cells-that-meet-specific-conditions-in-excel]
- **Ctrl+Fin**: última celda usada; revela el rango usado inflado. [VERIFICADO: Microsoft Learn y lista de atajos]
- **Inquire y Comparar hojas de cálculo** (*Spreadsheet Compare*): **solo en Excel para Windows con Microsoft 365 Apps para empresas** (o Office Professional Plus 2013, 2016 y 2019). Se activa en Archivo > Opciones > Complementos > Complementos COM > Inquire. Sirve para analizar un libro, ver las relaciones entre libros, hojas y celdas, **comparar dos versiones celda a celda** y limpiar el formato sobrante. [VERIFICADO: https://support.microsoft.com/en-US/Excel/turn-on-the-inquire-add-in]. La versión de consumo (Familia o Personal) **no lo tiene**: la guía debe ofrecer una alternativa (fórmula de comparación `=SI(Hoja1!A1<>Hoja2!A1;"≠";"")` en una hoja nueva).

**M. Rendimiento**
- Funciones volátiles según Microsoft: **NOW, TODAY, RANDBETWEEN, OFFSET, INDIRECT, INFO y CELL** (según los argumentos) y SUMIF en algunos casos. En español: AHORA, HOY, ALEATORIO.ENTRE, DESREF, INDIRECTO, INFO, CELDA y SUMAR.SI. ALEATORIO y MATRIZALEAT también lo son [VERIFICADO: https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-improving-calculation-performance (RAND) · https://support.microsoft.com/es-es/excel/how-to-correct-a-spill-error (RAND, RANDARRAY y RANDBETWEEN junto a «otras funciones volátiles»)]. Se recalculan en cada cambio con todas sus dependientes: «Use them sparingly». [VERIFICADO: https://learn.microsoft.com/en-us/office/client-developer/excel/excel-recalculation]
- Consecuencia práctica: en un informe de antigüedad de deuda, **no usar HOY() dentro de cada fila**; poner una **fecha de corte** en `Entradas` (además, el informe se puede repetir para cualquier fecha).
- Microsoft (actualizada el 11/11/2025) [VERIFICADO: página de rendimiento de learn.microsoft.com]:
  - «Avoid inter-workbook links when it is possible; they can be slow, easily broken, and not always easy to find and fix».
  - Reducir el **rango usado** (Ctrl+Fin; borrar filas y columnas sobrantes y guardar, con copia de seguridad).
  - **Referencias estructuradas recomendadas**; SUMA y SUMAR.SI manejan bien las columnas enteras, pero **SUMAPRODUCTO y las fórmulas matriciales calculan todas las celdas** de la columna.
  - Usar SUMAR.SI.CONJUNTO, CONTAR.SI.CONJUNTO, PROMEDIO.SI.CONJUNTO, MAX.SI.CONJUNTO y MIN.SI.CONJUNTO en lugar de SUMAPRODUCTO o de fórmulas matriciales.
  - INDICE en lugar de DESREF; las búsquedas exactas sobre rangos acotados (Tablas); desde la versión 1809 de Microsoft 365, BUSCARV y COINCIDIR exactos son mucho más rápidos.
  - El formato **.xlsb** ocupa unas 4 veces menos de media.
- **Comprobar rendimiento** (Revisar > Comprobar rendimiento; Excel para Microsoft 365): abre el panel «Rendimiento del libro», que cuenta las celdas sin datos que solo tienen formato, espacios en blanco o caracteres no imprimibles, y las limpia con «Optimizar hoja» u «Optimizar todo» (se puede Deshacer; ojo con las hojas de pixel art). [VERIFICADO en inglés: https://support.microsoft.com/en-us/excel/cleanup-cells-in-your-workbook · nombre en español CORREGIDO: https://support.microsoft.com/es-es/excel/cleanup-cells-in-your-workbook]
- Cálculo en manual: **peligro** (ICAEW: los usuarios pueden no saber que los resultados no están al día). F9 recalcula; Ctrl+Alt+F9, todo. [VERIFICADO]

**N. Matrices dinámicas: matiz importante**
- El Código del ICAEW (2024) dice «Don't use array formulas» y FAST 3.03-09 «Do not construct array formulas». Ambos pensaban en las antiguas fórmulas con Ctrl+Mayús+Intro. Las matrices dinámicas de Microsoft 365 (FILTRAR, UNICOS, ORDENAR, BUSCARX) son transparentes y el **marco de competencias del ICAEW de 2026 ya las incluye**. **Enseñarlas, con la regla de que el rango desbordado no se toca a mano** y que cada fórmula se explique en 24 segundos. [Interpretación propia sobre textos VERIFICADOS]
- FAST 3.03-08 también dice «Do not use Excel Names», y el ICAEW admite los nombres «si son claros». La guía puede usar **nombres solo para parámetros** (`TipoIVAGeneral`, `FechaCorte`) y Tablas para los datos.

### 2.3 Lista de revisión antes de entregar (para la guía; combina el ICAEW, FAST, AQuA y Panko)

**Datos**
- [ ] El número de filas y el total del importe cuadran con el sistema de origen (anotado en `Comprobaciones`).
- [ ] No hay duplicados de clave (factura, NIF, código de empleado), ni vacíos en campos obligatorios, ni textos con espacios de más.
- [ ] Los números son números y las fechas son fechas (alinear a la derecha y ESNUMERO); los códigos son texto.
- [ ] El periodo es el pedido (ni un mes de más ni de menos) y la fecha de corte está en `Entradas`.

**Lógica**
- [ ] Ningún número que pueda cambiar está dentro de una fórmula (Ir a > Especial > Constantes en las zonas de cálculo).
- [ ] Hay una sola fórmula por columna (sin triángulos verdes de incoherencia).
- [ ] Se ha probado con números fáciles y con casos límite: mes sin ventas, cliente nuevo, devolución negativa, importe 0, fecha de fin de mes y de año bisiesto, código inexistente (#N/D).
- [ ] Las comprobaciones están en verde y la maestra dice «TODO CUADRA».
- [ ] Los resultados son razonables (orden de magnitud, signo, comparación con el mes anterior).

**Presentación y entrega**
- [ ] El `Léeme` está al día: versión, fecha, fuentes, supuestos y limitaciones.
- [ ] Hay unidades y moneda en cada cifra; el redondeo es solo de presentación.
- [ ] Nada oculto que no deba ir; Inspeccionar documento hecho sobre una copia; sin vínculos externos rotos (Datos > Consultas y conexiones > **Vínculos de libro** [CORREGIDO: https://support.microsoft.com/es-es/excel/manage-workbook-links]; en versiones anteriores, «Editar vínculos»).
- [ ] Se comparte con el enlace y los permisos adecuados, o un PDF si el destinatario solo tiene que leer.
- [ ] Revisión por otra persona si el riesgo lo pide (AQuA: «All analysis shall be assured», en proporción al riesgo).

---

## 3. Colaboración: OneDrive, SharePoint y Teams

(Lo básico de coautoría ya está en `excel-moderno.md` §1.9. Aquí va lo que cambia el trabajo diario.)

### 3.1 Dónde vive el archivo
- **OneDrive para la Empresa**: archivos de la persona (borradores, cosas que comparte con unos pocos).
- **SharePoint**: archivos del equipo o del departamento (el informe mensual, la plantilla de presupuestos). **Los archivos de un canal de Teams se guardan en el sitio de SharePoint del equipo** (los canales privados y compartidos tienen su propio sitio); los que se envían en un chat se guardan en la carpeta «Microsoft Teams Chat Files» del OneDrive para la Empresa de quien los sube, y solo se comparten con las personas de esa conversación [VERIFICADO: https://support.microsoft.com/es-es/teams/files/file-storage-in-microsoft-teams · https://learn.microsoft.com/es-es/sharepoint/teams-connected-sites].
- SharePoint local (en servidores propios) **no admite coautoría**. [VERIFICADO: página de coautoría]

### 3.2 Coautoría: lo que hay que saber (VERIFICADO: https://support.microsoft.com/es-es/Excel/get-started/collaborate-on-excel-workbooks-at-the-same-time-with-co-authoring)
- Requisitos: Microsoft 365 al día, sesión iniciada, .xlsx, .xlsm o .xlsb (no «Strict Open XML»), archivo en OneDrive o SharePoint Online y **Autoguardado** activado.
- **Conflictos**: «si dos personas cambian la misma celda, gana el último cambio guardado». Consejo de Microsoft: **repartir zonas u hojas** entre las personas.
- **«Bloqueado»**: basta con que una persona abra el archivo con un Excel sin coautoría para que quede bloqueado para todos.
- Mensajes «Actualizar recomendado» o «Error de carga» al usar una función no compatible: se puede guardar una copia y volver a pegar los cambios.
- **Historial de versiones**: Windows, Archivo > Información > Historial de versiones; web, clic derecho en el archivo > Historial de versiones > Abrir versión o Restaurar. **Restaurar cuando nadie más esté editando.**
- **Mostrar cambios** (Excel para la web): panel con los cambios de otras personas y **los valores anteriores** de las celdas.
- **Vista de hoja** (Vista > Vista de hoja > Nueva): ordenar y filtrar para uno mismo sin desordenar a los demás en un archivo compartido; Excel la llama «Vista temporal» hasta que se le pone nombre. Ojo: los cambios en las celdas sí se guardan para todos, sea cual sea la vista. [VERIFICADO: https://support.microsoft.com/es-es/excel/create-and-manage-sheet-views-in-excel]
- Los «libros compartidos» antiguos (Revisar > Compartir libro) están obsoletos y no se enseñan (ver `curriculo.md`). Microsoft indica que con esa opción el libro admite hasta 256 personas, pero **no puede contener Tablas**. [VERIFICADO: página de especificaciones y límites]

### 3.3 Comentarios, notas y @menciones
- **Comentarios** (encadenados): conversación con respuestas; se pueden **resolver** (siguen visibles y se pueden reabrir); fondo blanco; panel lateral. **Notas**: anotación amarilla, sin respuestas, con formato e imágenes; son los «comentarios» de las versiones antiguas. Clic derecho > **Nuevo comentario** o **Nueva nota**, o desde la pestaña Revisar. [VERIFICADO: https://support.microsoft.com/es-es/office/the-difference-between-threaded-comments-and-notes-75a51eec-4092-42ab-abf8-7669077b7be3]
- **@menciones**: al escribir «@» y el nombre, la persona recibe **un correo con un enlace al comentario** (puede responder desde Outlook). Requisitos: cuenta de trabajo o de centro educativo y archivo en SharePoint u OneDrive para la Empresa. **Solo personas de la organización**. Si la persona no tiene permiso sobre el archivo, Excel pide dárselo. [VERIFICADO: https://support.microsoft.com/es-es/office/usar-menciones-para-etiquetar-a-alguien-para-recibir-comentarios-644bf689-31a0-4977-a4fb-afe01820c1fd]
- **Uso profesional** (propuesta): **notas** para documentar una celda de forma permanente («Fuente: informe X del ERP, 31/10/2026»); **comentarios** para preguntas y revisiones («@Ana, ¿este descuento es correcto?»), que se resuelven cuando se contestan. **Los comentarios no sustituyen al `Léeme`.**

### 3.4 Enviar por correo frente a compartir un enlace (síntesis práctica)

| | Adjuntar el archivo | Compartir un enlace (OneDrive o SharePoint) |
|---|---|---|
| Versiones | Cada destinatario tiene **una copia**; aparecen «versiones paralelas» | **Una sola versión**, con historial |
| Control | No se puede retirar | Se pueden **cambiar o quitar los permisos** y, solo en los vínculos «Cualquiera» (si la empresa los permite; en OneDrive, con suscripción a Microsoft 365), «Establecer la fecha de expiración» [CORREGIDO: https://support.microsoft.com/es-es/sharepoint/sharepoint-sharing-and-permissions/share-sharepoint-files-or-folders] |
| Datos personales | Riesgo alto (casos de la AEPD; MoD) | Menor, si el enlace es **«Personas que elija»** y no «Cualquiera» (Microsoft recomienda evitar «Cualquiera» «a menos que sea absolutamente necesario») [CORREGIDO: https://support.microsoft.com/es-es/sharepoint/sharepoint-sharing-and-permissions/share-sharepoint-files-or-folders] |
| Permisos | — | «Puede editar» o solo ver (en Windows, por defecto todos pueden editar) [VERIFICADO: página de coautoría] |
| Cuándo usarlo | A alguien de fuera sin acceso, **mejor en PDF o CSV con lo justo** y, si lleva datos sensibles, **cifrado** | Por defecto, dentro de la empresa |

### 3.5 Vínculos entre libros (referencias externas)
- Panel: **Datos > Consultas y conexiones > Vínculos de libro** (*Workbook Links*): «Actualizar todo», «Actualizar», «Cambiar origen» y «Romper vínculos» (estos dos, en «Más comandos (...)» junto a cada libro). [VERIFICADO en inglés: https://support.microsoft.com/en-us/office/find-links-external-references-in-a-workbook-fcbf4576-3aab-4029-ba25-54313a532ff1; nombre en español CORREGIDO: https://support.microsoft.com/es-es/excel/manage-workbook-links]
- Riesgos documentados por Microsoft: hay que actualizarlos; la opción «no actualizar» puede hacer que **nadie se dé cuenta de que los datos están desfasados**; aviso de seguridad al abrir; **romper vínculos convierte las fórmulas en valores y en el escritorio no se puede deshacer**; en la web fallan entre dominios distintos; **no hay búsqueda automática de todos los vínculos** (hay que mirar fórmulas buscando «.xl», el Administrador de nombres, los objetos y los títulos y series de los gráficos). [VERIFICADO]
- Microsoft (rendimiento), el ICAEW («Avoid referencing cells in one workbook from another») y FAST (1.03-02) coinciden: **evitarlos**. Alternativa moderna: **Power Query** leyendo el otro archivo, o todo en un mismo libro. [VERIFICADO]

---

## 4. Datos personales y confidencialidad (RGPD, LOPDGDD) en hojas de cálculo

### 4.1 Lo que dice la norma (lo justo para una usuaria de Excel)
- **RGPD art. 5.1**: c) **minimización** («adecuados, pertinentes y limitados a lo necesario»); d) **exactitud**; e) **limitación del plazo de conservación**; f) **integridad y confidencialidad**. [VERIFICADO: https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807]
- **Art. 32 (seguridad)**: medidas adecuadas al riesgo, entre ellas **«la seudonimización y el cifrado de datos personales»** y la capacidad de restaurar los datos. [VERIFICADO: mismo texto]
- **Art. 33 (brechas)**: notificar a la autoridad «sin dilación indebida y, de ser posible, **a más tardar 72 horas** después de que haya tenido constancia». Enviar por error un Excel con datos de clientes **es una brecha**: hay que avisar enseguida a quien lleve la protección de datos en la empresa (DPD o responsable), no «borrarlo y callar». [VERIFICADO: art. 33; la aplicación al caso del Excel es interpretación propia]
- **LOPDGDD art. 5**: deber de confidencialidad para «todas las personas que intervengan en cualquier fase» del tratamiento, que **se mantiene aunque haya terminado la relación** con la empresa. [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673]
- **LOPDGDD art. 87**: la empresa puede revisar el uso de los dispositivos que da a la plantilla para controlar el trabajo, con criterios de uso establecidos. Consecuencia: **no guardar datos de la empresa en cuentas o dispositivos personales**. [VERIFICADO: mismo texto; la consecuencia es interpretación propia]

### 4.2 Sanciones de la AEPD que parecen de un curso de Excel
- Correo masivo **sin copia oculta (CCO)**: 3.000 € a Clidea (2.000 € por el art. 5.1.f y 1.000 € por el art. 32; 349 destinatarios; publicado el 11/10/2024); 1.000 € a una residencia (06/03/2025); 10.000 € a un despacho de Girona (8 destinatarios). [VERIFICADO-sec: https://www.economistjurist.es/?p=213960 · https://www.economistjurist.es/?p=221341]
- **Hoja de cálculo accesible por enlace** con nombre, apellidos y DNI de 10.837 personas, que además guardaba datos más tiempo del anunciado (18 meses): **35.000 €** (art. 5.1.f). La empresa alegó «error administrativo puntual» de una persona recién contratada. [VERIFICADO-sec: https://www.economistjurist.es/?p=229395]
- Gimnasio que, por error, adjuntó a un correo comercial enviado a 334 personas un fichero con nombre, apellidos, DNI, domicilio, teléfonos y correo de 9.293 clientes: 3.000 € (noticia de 2012, con la antigua LOPD de 1999, art. 10, deber de secreto); pidió disculpas en otro correo dos días después, pero lo sancionaron igual [CORREGIDO: https://www.legaltoday.com/practica-juridica/derecho-publico/proteccion-datos/multa-de-3000-euros-a-un-gimnasio-por-enviar-correo-electronico-con-datos-de-9293-clientes-2012-06-25/ (prensa jurídica; no se localizó la resolución de la AEPD)].

### 4.3 Medidas concretas en Excel (propuesta para la guía, basada en el art. 5 y el 32, el ICO y Microsoft)
1. **Minimizar**: antes de compartir, quitar las columnas que no hacen falta (DNI, teléfono, IBAN, salario, salud). Para un análisis de ventas por zona no hace falta el nombre del cliente.
2. **Seudonimizar**: sustituir el nombre por un código (`CLI-00123`) y guardar la tabla de correspondencias **aparte y protegida**.
3. **Agregar**: enviar totales (tabla dinámica **copiada como valores**) en lugar del detalle.
4. **Datos de prueba ficticios** para formación, demostraciones y para pedir ayuda (también a una IA).
5. **Cifrar con contraseña** los archivos con datos personales que salgan de la empresa y **enviar la contraseña por otro canal**.
6. **Compartir con enlace a personas concretas**, revisar los permisos y quitarlos al acabar el proyecto.
7. **CCO** en los correos a varias personas externas (o combinar correspondencia).
8. **Conservación**: borrar las pestañas y los archivos antiguos con datos personales cuando ya no hagan falta; no guardar «por si acaso».
9. **Antes de enviar fuera, inspeccionar** (ver §4.4).
10. **No usar cuentas personales** (Gmail, WeTransfer o IA personal) para datos de la empresa.

### 4.4 Lo que se esconde en un Excel y cómo encontrarlo

**Inspector de documento**: Archivo > Información > **Comprobar si hay problemas > Inspeccionar documento** [VERIFICADO: https://support.microsoft.com/es-es/office/quitar-datos-ocultos-e-informaci%C3%B3n-personal-inspeccionando-documentos-presentaciones-o-libros-356b7b5d-77af-44fe-a07f-9aa4d085966f]
- **Detecta y puede quitar**: comentarios y anotaciones; propiedades del documento e información personal (autor, nombre de usuario, ruta de la impresora, etc.); encabezados y pies de página; **filas y columnas ocultas con datos**; **hojas ocultas**; datos XML personalizados; contenido invisible.
- **Detecta pero NO puede quitar**: **vínculos externos**; archivos u objetos incrustados; macros y VBA; **datos en caché de tablas y gráficos dinámicos**, segmentaciones y escalas de tiempo; escenarios; **filtros y nombres ocultos**.
- Advertencias: usarlo **sobre una copia** (Guardar como antes); puede no deshacerse; quitar filas u hojas ocultas **puede cambiar los resultados** de las fórmulas.

**Guía del ICO de julio de 2025** («Disclosing documents to the public securely», nacida tras el caso del MoD) [VERIFICADO: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/security/disclosing-documents-to-the-public-securely/checklist-avoid-an-accidental-breach-when-personal-information-is-hidden-in-spreadsheets/]:
- **Métodos ineficaces** que hay que evitar: ocultar filas, columnas u hojas; **mover los datos personales a filas o columnas lejanas**; usar contraseñas que solo impiden editar en lugar de contraseñas de apertura fuertes.
- Revisar la información personal de las **funciones de resumen (tablas dinámicas y gráficos)**, de los **vínculos a fuentes externas** y de la **información incrustada (modelos de datos)**.
- **Convertir a formatos simples como CSV** para que aflore todo lo visible; **comprobar que el tamaño del archivo no es mayor de lo esperado**; tener un calendario de conservación; formar a la plantilla al entrar y de forma periódica.

**Lista de la guía «antes de enviar un Excel fuera de la empresa»** (síntesis):
1. ¿Hace falta mandar el archivo? ¿No basta un PDF o un resumen?
2. Mostrar todas las hojas (clic derecho en una pestaña > Mostrar), todas las filas y columnas, y quitar los filtros.
3. Buscar tablas dinámicas: su **caché guarda con el libro los datos de origen**, también los que no se ven, aunque se borre la hoja de datos. Doble clic en un valor (o clic derecho > Mostrar detalles) coloca en una hoja nueva los datos de detalle en que se basa [VERIFICADO: https://support.microsoft.com/es-es/excel/expand-collapse-or-show-details-in-a-pivottable-or-pivotchart · https://support.microsoft.com/es-es/office/collab-files/remove-hidden-data-and-personal-information-by-inspecting-documents-presentations-or-workbooks]. Microsoft avisa de que la opción «Guardar datos de origen con un archivo» «no debe usarse para administrar la privacidad de datos». Solución: copiar y pegar como valores en un libro nuevo.
4. Revisar Power Query y el modelo de datos (Datos > Consultas y conexiones).
5. Revisar los nombres (Administrador de nombres) y los vínculos externos.
6. Inspeccionar documento sobre una copia.
7. ¿Pesa más de lo normal? Sospechar.
8. Si lleva datos personales: cifrado, enlace a personas concretas o CCO; contraseña por otro canal.

### 4.5 IA con datos de la empresa
Todo el marco (art. 4 del Reglamento de IA, decálogo de la AEPD del 27/10/2026, política interna de la AEPD, protección de datos de Copilot, semáforo de datos y protocolo de verificación en 5 pasos) **ya está en `excel-moderno.md` §4.3 (VERIFICADO allí)**. Para esta línea solo añado dos reglas para el temario de empresa:
- **Usar solo la herramienta que autorice la empresa, con la cuenta de trabajo**, y nunca pegar datos personales ni confidenciales en una IA personal. La IA no está libre de errores: lo que entregue la alumna lo **comprueba ella** (cuadres, casos límite) y **lo anota en el `Léeme`** («fórmula de la columna F propuesta por Copilot, comprobada con 5 casos el 14/11/2026»).
- Los archivos que llegan de fuera pueden llevar **instrucciones ocultas** (texto blanco, comentarios) dirigidas a la IA: es otra razón para Inspeccionar documento.

---

## 5. El contexto de empresa española que aparece en los encargos de Excel

### 5.1 IVA
- **Tipos** [VERIFICADO: https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/IVA_reperc/Tipos_IVA_2026.pdf (02/06/2026) y Ley 37/1992 arts. 90 y 91]:
  - **General 21 %**.
  - **Reducido 10 %**: alimentación en general, agua, transporte de viajeros, hostelería y restauración, viviendas, gafas y lentillas, entradas a espectáculos culturales, obras de renovación de vivienda con requisitos…
  - **Superreducido 4 %**: pan, leche, huevos, quesos, fruta, verdura, legumbres, cereales y **aceite de oliva**; libros, periódicos y revistas (también digitales); medicamentos de uso humano; compresas, tampones y preservativos; vehículos y prótesis para personas con discapacidad; VPO de régimen especial…
  - **0 %**: donativos de determinados bienes a entidades de mecenazgo.
  - Excepciones a 21 % que sorprenden: bebidas con azúcares añadidos, cosméticos, peluquería, gimnasios, entradas a zoos y parques de atracciones, servicios funerarios, locales de negocio.
  - **2026, tipos temporales**: electricidad (≤10 kW), gas natural, pellets y leña al **10 % del 22/03/2026 al 31/05/2026**, y carburantes **del 22/03/2026 al 30/06/2026**. El resto del año, 21 %.
- **Art. 90.Dos LIVA**: «El tipo impositivo aplicable a cada operación será el vigente en el momento del devengo». [VERIFICADO: BOE-A-1992-28740]
  - **Diseño en Excel**: tabla `TiposIVA` con las columnas `Código | Descripción | Porcentaje | Desde | Hasta`, y búsqueda por fecha:
    `=SUMAR.SI.CONJUNTO(TiposIVA[Porcentaje];TiposIVA[Código];[@CódigoIVA];TiposIVA[Desde];"<="&[@Fecha];TiposIVA[Hasta];">="&[@Fecha])`
    (funciona en HyperFormula). Con una comprobación de que hay exactamente una fila que encaja: `=CONTAR.SI.CONJUNTO(...)=1`.
- **Recargo de equivalencia** (comercio minorista, persona física): el proveedor añade el recargo a la factura; el minorista no presenta el IVA de esas ventas ni deduce el soportado. Tipos (art. 161 LIVA): **5,2 %** (general), **1,4 %** (reducido), **0,50 %** (superreducido) y **1,75 %** (tabaco). [VERIFICADO: BOE, arts. 154 y 161]
  - Ejemplo: base 100 € al 21 % → IVA 21 € + recargo 5,20 € → total 126,20 €.
- **Redondeo**: la cuota se calcula y redondea a 2 decimales (`=REDONDEAR(Base*Tipo;2)`). Si se redondea por línea o por total, el resultado puede variar 1 céntimo: la guía debe enseñar a **elegir un criterio y aplicarlo siempre** [criterio práctico; el reglamento no se ha revisado en esta sesión].

### 5.2 Retenciones de IRPF en facturas
- Actividades profesionales: **15 %** sobre los ingresos íntegros. **7 %** el periodo de inicio y los **dos siguientes**, si no se ejerció ninguna actividad profesional el año anterior y **se comunica por escrito al pagador** (que debe guardar la comunicación firmada). También 7 % para recaudadores municipales, mediadores de seguros con auxiliares externos, etc. [VERIFICADO: RD 439/2007, art. 95, https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820]
- Arrendamiento de inmuebles urbanos: **19 %** sobre todos los conceptos, **excluido el IVA**. [VERIFICADO: art. 100]
- Propiedad intelectual: 15 % (art. 101). [VERIFICADO]
- **Fórmula de factura de profesional**: base 1.000 € → IVA (21 %) 210 € → retención (15 %) −150 € → **total a pagar 1.060 €**. La retención se calcula **sobre la base, no sobre el total**. Error típico: `=Total*15%`.
- Asientos (PGC): la retención la ingresa quien paga, en la cuenta **4751 «Hacienda Pública, acreedora por retenciones practicadas»**. [VERIFICADO: nombre de la cuenta en el PGC, BOE-A-2007-19884]

### 5.3 Facturas: datos obligatorios y numeración (RD 1619/2012) [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696]
- **Art. 6.1**, contenido mínimo:
  - a) **Número y, en su caso, serie**, con numeración **correlativa dentro de cada serie**. Series obligatorias: las **rectificativas** y las expedidas por el destinatario o por terceros, entre otras.
  - b) Fecha de expedición.
  - c) Nombre y apellidos o razón social de quien factura y del destinatario.
  - d) NIF de quien factura (y del destinatario en ciertos casos, p. ej. en las operaciones entre empresas en España).
  - e) Domicilio de ambos.
  - f) Descripción, con **precio unitario sin IVA** y descuentos.
  - g) Tipo o tipos de IVA.
  - h) **Cuota**, por separado.
  - i) Fecha de la operación si es distinta de la de expedición.
  - j) Si está exenta, la referencia legal.
  - m) «Inversión del sujeto pasivo» y otras menciones especiales (criterio de caja, etc.).
- **Art. 6.2**: bases separadas por tipos de IVA distintos.
- **Art. 4, factura simplificada**: hasta **400 €** con IVA (o para rectificar), y hasta **3.000 €** en venta al por menor, hostelería y restauración, peluquería, transporte de personas, aparcamientos, etc.
- **Art. 11, plazo**: en el momento de la operación; si el cliente es empresario o profesional, **antes del día 16 del mes siguiente** al devengo.
- **Art. 19**: conservar las facturas recibidas y las copias de las emitidas durante el plazo de la Ley General Tributaria [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696#a19 · 4 años de prescripción, LGT art. 66: https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186#a66 · el Código de Comercio (art. 30) pide 6 años, contados desde el último asiento, para los libros, la correspondencia, la documentación y los justificantes: https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627#art30].
- **Ejercicios de Excel**: comprobar que la numeración no tiene huecos ni duplicados por serie (`=SI(Y([@Número]<MAX.SI.CONJUNTO([Número];[Serie];[@Serie]);CONTAR.SI.CONJUNTO([Serie];[@Serie];[Número];[@Número]+1)=0);"hueco después";"")`: excluye la última de cada serie); que todas las facturas tienen NIF; que la cuota = base × tipo (±0,01).

### 5.4 VERI\*FACTU y sistemas informáticos de facturación (SIF)
- **Normas**: RD 1007/2023 (Reglamento de requisitos de los SIF, RRSIF), modificado por el **RD 254/2025** (BOE del 02/04/2025); plazos ampliados por el **RDL 15/2025, de 2 de diciembre**. [VERIFICADO: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html]
- **Fechas vigentes**: contribuyentes del Impuesto sobre Sociedades, sistemas adaptados **antes del 1 de enero de 2027**; resto (autónomos en IRPF, etc.), **antes del 1 de julio de 2027**. Hasta entonces, «periodo de pruebas». [VERIFICADO: nota informativa de la AEAT (actualizada el 13/10/2026) y FAQ (21/10/2026)]
- ⚠️ La página de la AEAT (actualizada el 03/11/2026) enlaza una **«Comunicación del Ministerio de Hacienda de 05/10/2026 sobre una previsión de ampliación del plazo de adaptación de los SIF»** (https://www.hacienda.gob.es/sgt/gabsehacienda/nota-informativa-verifactu.pdf). **No se pudo leer** (error 503 y conexión cortada). Puede que las fechas vuelvan a cambiar. **En la guía: «a fecha de…» y enlace a la AEAT, nunca fechas sin contexto.**
- **Regla de los 4 «NO»**: se aplica a quien expide facturas en España y (1) **no** factura exclusivamente a mano, (2) **no** está en el SII, (3) **no** tiene el domicilio fiscal en el País Vasco ni en Navarra y (4) **no** tiene una resolución que lo exima. [VERIFICADO: FAQ de ámbito de aplicación]
- **Excel y Word** (respuesta de la AEAT, clave para la guía) [VERIFICADO: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-ambitos-aplicacion.html]:
  - **No es un SIF** si la hoja de cálculo o el procesador de texto solo se usa para introducir los datos de las facturas, emitirlas, imprimirlas y conservarlas. **Un simple listado de facturas emitidas con sumas tampoco.**
  - **Sí es un SIF** si además procesa los datos para generar directamente los libros registro de IVA o IRPF, la contabilidad, etc. Ejemplo de la AEAT: **«programando una Macro, para generar el libro registro de facturas expedidas»**.
  - **No se puede combinar** la facturación con un SIF con la facturación manual (salvo MiFacturae para facturar a la Administración).
  - La AEAT ofrece una **aplicación de facturación gratuita** para quien la necesite.
- Sanciones (art. 201 bis LGT): **50.000 € por ejercicio** por tener sistemas no conformes; 150.000 € por fabricarlos o venderlos. [VERIFICADO: FAQ de la AEAT]
- **Mensaje para la alumna**: puede hacer en Excel una plantilla de presupuesto u oferta y analizar las facturas exportadas del programa de facturación, pero **no debe montar «el sistema de facturación de la empresa» en Excel con macros**.

### 5.5 Factura electrónica obligatoria entre empresas (Ley 18/2022 «Crea y Crece», art. 12)
- **Reglamento aprobado**: **RD 238/2026, de 25 de marzo** (BOE del 31/03/2026, en vigor el 20/04/2026), y **Orden HAC/1028/2026, de 2 de octubre** (BOE del 05/10/2026), que regula la **solución pública** y entró en vigor el **6/10/2026**. Los plazos cuentan desde esa fecha. [VERIFICADO: https://sede.agenciatributaria.gob.es/Sede/iva/factura-electronica/calendario-implantacion.html · https://www.boe.es/buscar/act.php?id=BOE-A-2026-7295]
- **Calendario**:
  - Emitir y recibir factura electrónica: **más de 8 M€** de volumen de operaciones, desde el **6/10/2027**; **resto**, desde el **6/10/2028**.
  - Comunicar los **estados** (aceptación o rechazo y **pago efectivo completo con su fecha**): más de 8 M€, 6/10/2027; resto de personas jurídicas, 6/10/2028; **personas físicas, 6/10/2029**.
  - Las grandes empresas, durante 12 meses, deben **acompañar la factura con un PDF legible**.
- **Formato**: mensaje estructurado según la norma europea **EN 16931**, en **UBL, CII, EDIFACT o Facturae** (la solución pública usa UBL). Los estados se envían **en un máximo de 4 días naturales** (sin contar sábados, domingos ni festivos nacionales). El plazo de pago se rige por el art. 4 de la Ley 3/2004 de morosidad [VERIFICADO: RD 238/2026]. Plazo legal: 30 días naturales desde la recepción de las mercancías o servicios (si el contrato no fija otro), ampliable por pacto hasta un máximo de 60 días naturales [VERIFICADO: https://www.boe.es/buscar/act.php?id=BOE-A-2004-21830#a4].
- **Qué cambia para Excel**: **un PDF hecho en Excel deja de ser una factura válida entre empresas** cuando llegue la obligación. A cambio, habrá **datos fiables de fechas de aceptación y pago**: informes de periodo medio de pago, cumplimiento de plazos y antigüedad de la deuda.

### 5.6 Nóminas y Seguridad Social, a grandes rasgos (2026)
- **Tipos del Régimen General 2026** [VERIFICADO: https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/36537]:

| Concepto | Empresa | Trabajador | Total |
|---|---|---|---|
| Contingencias comunes | 23,60 % | 4,70 % | 28,30 % |
| Desempleo (indefinido) | 5,50 % | 1,55 % | 7,05 % |
| Desempleo (temporal) | 6,70 % | 1,60 % | 8,30 % |
| FOGASA | 0,20 % | — | 0,20 % |
| Formación profesional | 0,60 % | 0,10 % | 0,70 % |
| MEI (Mecanismo de Equidad Intergeneracional) 2026 | 0,75 % | 0,15 % | 0,90 % |
| Accidentes de trabajo y enfermedades profesionales | Tarifa por actividad | — | Variable |

  - MEI: 2026 = 0,90 (0,75 y 0,15); **2027 = 1,00**; 2028 = 1,10; **2029–2050 = 1,20**. [VERIFICADO: LGSS, disposición transitoria añadida por el RDL 2/2023, BOE-A-2015-11724]
  - Bases mensuales 2026: **máxima 5.101,20 €**; mínimas por grupo (grupo 1: 1.989,30 €; grupos 4 a 7: 1.424,40 €). [VERIFICADO: seg-social.es]
  - Contratos de menos de 30 días: cotización adicional de **33,62 €** a cargo de la empresa. [VERIFICADO]
  - **Cotización de solidaridad** (desde 2025) sobre lo que supera la base máxima, por tramos (escala final del 5,5 %, 6 % y 7 %, con un periodo transitorio). [VERIFICADO: LGSS art. 19 bis y disposición transitoria cuadragésima segunda, https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724; en 2026 los tipos son 1,15 % (hasta un 10 % por encima de la base máxima), 1,25 % (del 10 % al 50 %) y 1,46 % (más del 50 %); la escala final se alcanza en 2045; se reparte entre empresa y trabajador en la misma proporción que las contingencias comunes]
  - La retención de IRPF de la nómina **depende de cada persona** (algoritmo de la AEAT) y no se puede sacar con una regla de tres.
- **Coste de empresa aproximado** (para presupuestos de personal; cálculo propio): 23,60 + 5,50 + 0,20 + 0,60 + 0,75 = **30,65 %** de la base de cotización, más accidentes de trabajo y enfermedades profesionales (para el personal en trabajos exclusivos de oficina, letra «a» del cuadro II de la tarifa de primas, es el 1,50 %: 0,80 de IT + 0,70 de IMS [VERIFICADO: disposición adicional sexagésima primera de la LGSS, introducida por el RDL 3/2026, https://www.boe.es/buscar/act.php?id=BOE-A-2026-2548]). En Excel: `=MIN(MAX(BaseMensual;BaseMin);BaseMax)*TipoEmpresa`, donde `BaseMensual` = bruto anual ÷ 12 (las pagas extra, prorrateadas) y los tres parámetros van en `Entradas`. **Con el aviso** de que es una estimación: las nóminas se hacen con software de nóminas (a3nom, Sage, etc.) o la gestoría.
- **Encargos típicos en Excel**: presupuesto de plantilla (coste por puesto y mes), cuadre de las nóminas con la contabilidad (cuentas 640 «Sueldos y salarios», 642 «Seguridad Social a cargo de la empresa», 476 «Organismos de la Seguridad Social, acreedores», 4751 y 465 «Remuneraciones pendientes de pago» [VERIFICADO: PGC]), informes de RRHH con datos **seudonimizados** (altas, bajas, absentismo y horas extra).

### 5.7 Procesos financieros recurrentes (los encargos de Excel de verdad)

**Cierre mensual**
- Lista de tareas con fecha límite (D+1, D+3…), responsable y estado; conciliaciones (bancos, clientes, proveedores, IVA, nóminas); periodificaciones; comparación con el mes anterior y con el presupuesto; explicación de desviaciones. Excel se usa como **checklist** y **papeles de trabajo** con comprobaciones [práctica profesional habitual; NO VERIFICABLE: no enseñarlo como dato ni como norma].
- Plazos fiscales que marcan el calendario: IVA (modelo 303) mensual o trimestral; retenciones (modelos 111 y 115); SII para quien esté obligado. Nombres de los modelos [VERIFICADO: https://sede.agenciatributaria.gob.es/Sede/presentar-consultar-declaraciones-modelo.html — 303 «IVA. Autoliquidación»; 111 «Retenciones e ingresos a cuenta. Rendimientos del trabajo, de actividades profesionales, de actividades agrícolas y ganaderas y premios»; 115 «Retenciones e ingresos a cuenta. Rentas o rendimientos procedentes del arrendamiento o subarrendamiento de inmuebles urbanos»].

**Conciliación bancaria**
- Comparar el extracto (Norma 43, CSV o Excel del banco) con el mayor de la cuenta **572** «Bancos e instituciones de crédito c/c vista, euros» [VERIFICADO: PGC]. Partidas típicas sin emparejar: cobros y pagos en tránsito, comisiones, devoluciones de recibos, transferencias agrupadas.
- Técnica en Excel: clave de emparejamiento por importe (y fecha ± n días); `=CONTAR.SI.CONJUNTO(Banco[Importe];[@Importe];Banco[Fecha];">="&[@Fecha]-3;Banco[Fecha];"<="&[@Fecha]+3)`; Power Query > Combinar consultas (combinación externa izquierda y anticombinación para lo pendiente); resumen «saldo según banco − pendientes = saldo según contabilidad» con comprobación de cuadre.

**Antigüedad de la deuda de clientes (aging)**
- Tramos según los días vencidos a la **fecha de corte**: no vencido, 1–30, 31–60, 61–90 y más de 90.
- **Sin SI anidados** (FAST): tabla de tramos con los límites inferiores (`-99999 → «No vencido»`, `1 → «1-30»`, `31 → «31-60»`, `61 → «61-90»`, `91 → «>90»`) y
  `=BUSCARV(FechaCorte-[@Vencimiento];Tramos;2;VERDADERO)`.
- **No usar HOY()** en cada fila (volátil y no se puede repetir el informe): la `FechaCorte` va en `Entradas`.
- Periodo medio de cobro (DSO) = saldo de clientes ÷ ventas a crédito del periodo × días del periodo [fórmula estándar]. Cuenta 430 «Clientes» y 436 «Clientes de dudoso cobro». [VERIFICADO: PGC]
- En HyperFormula esES no existen INDIRECTO ni SIFECHA (DATEDIF aparece sin traducir) y DIAS aparece como «DÍAS»: en la hoja en vivo, **restar fechas** directamente. [VERIFICADO: `raw/hf_esES.json`]

**Presupuesto frente a real**
- Columnas: Presupuesto, Real, Desviación (= Real − Presupuesto), % (`=SI(Presupuesto=0;"";Desviación/ABS(Presupuesto))`) y «¿Favorable?» según sea ingreso o gasto (`=SI([@Tipo]="Ingreso";[@Desviación]>=0;[@Desviación]<=0)`). Acumulado del año (YTD), previsión de cierre y comentario de las desviaciones que superen un umbral (en `Entradas`).
- ICAEW: **zonas separadas para la previsión y lo real**, con fórmulas que eligen qué dato se usa; **no sobrescribir la previsión con lo real**. [VERIFICADO: ICAEW, «Identify and separate forecast or dummy data»]

**Indicadores comerciales** (definirlos por escrito en el `Léeme`; la definición es la mitad del trabajo)
- Ventas netas (¿con o sin IVA?, ¿por fecha de factura, de pedido o de cobro?, ¿con abonos?), margen bruto y %, ticket medio, unidades, clientes activos y nuevos, recurrencia, ventas por comercial frente a objetivo, crecimiento interanual (mismo mes del año anterior), conversión de ofertas, periodo medio de cobro y concentración (peso de los 10 mayores clientes).

### 5.8 Formatos y archivos que llegan de los sistemas españoles
- **Configuración regional** (ver `localizacion.md` §1 y §6): fechas DD/MM/AAAA, coma decimal, punto de miles y separador de listas `;`. Un CSV «español» va con `;`.
- **Codificación**: «CSV (delimitado por comas)» guarda en ANSI (Windows-1252) y estropea tildes y eñes fuera de Windows; «CSV UTF-8» es lo recomendable. **Un CSV UTF-8 sin BOM abierto con doble clic sale con caracteres raros**: hay que abrirlo con **Datos > Obtener datos > De un archivo > De texto o CSV** (Power Query), con el origen 65001 (UTF-8). [VERIFICADO: https://support.microsoft.com/es-es/office/abrir-archivos-csv-utf-8-correctamente-en-excel-8a935af5-3416-4edd-ba7e-3dfd2bc4a032 y `localizacion.md`]
- **Ceros a la izquierda y conversiones**: al abrir un .csv, Excel aplica el formato por defecto y **quita los ceros iniciales** (CP 08001 → 8001; cuenta 4300001; códigos de artículo). Microsoft propone el Asistente para importar texto con la columna como Texto o cambiar la extensión a .txt. [VERIFICADO: https://support.microsoft.com/es-es/office/importar-o-exportar-archivos-de-texto-txt-o-csv-5250ac4c-663c-47ce-937b-339e391393ba]
- **Opciones de conversión automática** (Archivo > Opciones > Datos > Conversión automática de datos) [VERIFICADO: https://support.microsoft.com/es-es/Excel/data-import-and-analysis-options-in-excel]:
  - «Eliminar los ceros a la izquierda y convertirlos en un número».
  - «Mantener los primeros 15 dígitos de los números largos y mostrarlos en notación científica» (**un IBAN o un número de tarjeta pierde los dígitos a partir del 15.º**: Excel tiene 15 dígitos de precisión [VERIFICADO: especificaciones y límites]).
  - «Convertir los dígitos que rodean a la letra "E" en un número en notación científica».
  - «Convertir letras y números continuos en una fecha».
  - «Al cargar un archivo .csv o similar, notificarme cualquier conversión automática de datos».
- **Cambiar el separador**: en Windows, Configuración de región > Configuración adicional > Números > «Separador de listas» (afecta a todos los programas), o solo en Excel quitando «Usar separadores del sistema» en Opciones > Avanzadas. [VERIFICADO: misma página de importar y exportar]
- **Exportaciones de ERP** (problemas típicos; SAP: signo menos a la derecha al exportar una lista ALV a Excel, p. ej. «90.02-» [VERIFICADO: https://userapps.support.sap.com/sap/support/knowledge/en/3525508]; A3, Sage y Holded [NO VERIFICABLE: no enseñarlo como dato; presentarlo como ejemplos habituales]; Odoo, verificado abajo):
  - **SAP**: exportaciones «a hoja de cálculo» o «fichero local», con encabezados repetidos, subtotales intercalados y, en algunos informes, **signo menos al final** («1.234,56-») que Excel no entiende como número.
  - **A3 (Wolters Kluwer) y Sage**: listados con cabeceras de página, celdas combinadas y totales dentro de los datos. Holded: exporta a Excel o CSV desde cada listado.
  - **Odoo**: exporta a .csv o .xls; la importación espera comas por defecto; recomienda fechas **ISO AAAA-MM-DD**; las fechas pueden invertir el día y el mes; admite importes como 32.000,00 o (32000.00 €); detecta el tipo con las 10 primeras filas; **una importación no se puede deshacer**. [VERIFICADO: https://www.odoo.com/documentation/18.0/applications/essentials/export_import_data.html]
  - **Remedio general**: Power Query (quitar filas superiores, filtrar subtotales, promover encabezados, tipo con configuración regional, reemplazar «-» final, ESPACIOS, LIMPIAR y quitar el carácter 160) y **un paso de comprobación** del número de filas y del total frente al listado del ERP.
- **Norma 43 (Cuaderno 43 de la AEB, CECA y UNACC, «Información normalizada de cuenta corriente», versión de junio de 2012)** [VERIFICADO: https://www.caixabank.es/deployedfiles/empresas/Estaticos/pdf/Transferenciasyficheros/q43Junio2012.pdf]:
  - Registros de **longitud fija de 80 caracteres**. Tipos por código: **11** cabecera de cuenta, **22** movimiento (obligatorio), **23** complementarios de concepto (hasta 5), **24** equivalencia de divisa, **33** final de cuenta y **88** fin de fichero.
  - Registro 22: oficina de origen (7–10), **fecha de operación (11–16, AAMMDD)**, fecha valor (17–22), concepto común (23–24), concepto propio (25–27), **clave debe o haber (28: 1 = debe, 2 = haber)**, **importe (29–42, 14 posiciones, 2 decimales sin coma)**, n.º de documento (43–52), referencia 1 (53–64) y referencia 2 (65–80).
  - Conceptos comunes: 01 talones y reintegros, 02 abonarés e ingresos, 03 domiciliados y recibos, 04 giros y transferencias, 05 amortizaciones de préstamos, 06 remesas de efectos, 11 cajero automático, 12 tarjetas, 13 operaciones con el extranjero…
  - El registro 33 trae el número de apuntes y el total del debe y del haber, y el **saldo final**: **comprobación natural** del importe.
  - Ejercicio para la hoja en vivo (HyperFormula):
    - Tipo: `=IZQUIERDA(A2;2)`.
    - Fecha: `=FECHA(2000+EXTRAE(A2;11;2);EXTRAE(A2;13;2);EXTRAE(A2;15;2))`.
    - Importe con signo: `=VALOR(EXTRAE(A2;29;14))/100*SI(EXTRAE(A2;28;1)="1";-1;1)`.
    - Cuadre con el registro 33.
  - En Excel real: Power Query > Dividir columna > **Por posiciones**.

---

## 6. Las habilidades «blandas» de la autonomía

### 6.1 Recoger requisitos (base: AQuA Book 2025, capítulo «Engagement and scoping») [VERIFICADO: gov.uk]
AQuA pide acordar al principio: la pregunta y su contexto, los **límites** del análisis, los plazos y recursos, los supuestos, riesgos e incertidumbres, la **precisión y el margen de error aceptables**, los resultados que se entregan, el nivel de revisión y el riesgo aceptable, y **las fuentes de datos y su calidad** (las aporta quien encarga). Todo queda en un **documento de especificación** que firma quien encarga.

**Las 15 preguntas de la guía** (adaptadas a una oficina española; propuesta):
1. ¿Para quién es y **qué decisión** se va a tomar con esto?
2. ¿Cuál es la pregunta exacta? (Escribirla con sus palabras y devolvérsela: «Entonces quieres saber…»).
3. ¿Para cuándo? ¿Hay una fecha anterior para ver un borrador?
4. ¿Es una vez o se repetirá (mensual, semanal)? ¿Quién lo mantendrá?
5. ¿Qué periodo, qué empresas, centros o líneas entran y cuáles no?
6. **Definiciones**: ¿ventas con o sin IVA?, ¿por fecha de factura, de pedido o de cobro?, ¿se restan los abonos?, ¿qué es «cliente activo»?
7. ¿De dónde salen los datos? ¿Quién es el responsable? ¿Hay un informe oficial con el que deba cuadrar?
8. ¿Qué nivel de detalle y de precisión hace falta (euros, miles, %)?
9. ¿Qué formato de entrega (Excel compartido, PDF, una diapositiva, un correo) y para qué versión de Excel?
10. ¿Quién más tiene que dar el visto bueno?
11. ¿Hay datos personales o confidenciales? ¿Quién puede verlo?
12. ¿Hay algo hecho antes (un informe anterior, una plantilla)?
13. ¿Qué pasa si los datos no cuadran o faltan? ¿A quién pregunto?
14. ¿Qué sería un buen resultado? (Un ejemplo de tabla o gráfico ideal).
15. ¿Qué **no** hace falta? (Para acotar el alcance.)

→ Entregable de la lección: **«ficha de encargo» de una página** (plantilla en .xlsx o en el `Léeme`), enviada por correo a quien encarga para que la confirme.

### 6.2 Estimar el tiempo
- Desglosar: conseguir los datos, limpiarlos, construir, comprobar, presentar y documentar. **Los datos y su limpieza suelen llevar la mayor parte** [NO VERIFICABLE: no enseñarlo como dato; presentarlo como experiencia común, sin cifra].
- Estimación de tres puntos: (optimista + 4 × probable + pesimista) ÷ 6 [técnica PERT estándar]. Ejercicio en la hoja en vivo.
- Avisar pronto: «con los datos de hoy puedo darte X el jueves; Y necesita el fichero del banco».
- Panko: la prisa y el estrés multiplican los errores (×2 a ×10). **Pedir plazo es parte de la calidad.** [VERIFICADO: Panko, tabla 3]

### 6.3 Pedir datos (plantilla de correo de la guía)
Qué pedir: campos exactos y su significado; periodo; **una fila por registro**, sin celdas combinadas ni subtotales; códigos como texto; formato (.xlsx o CSV UTF-8 con `;`); fecha de extracción; **total de control** (n.º de registros e importe total) para cuadrar; persona de contacto. Al recibirlos: acusar recibo, perfilar (filas, vacíos, duplicados, rango de fechas, máximos y mínimos) y **preguntar antes de suponer**.

### 6.4 Documentar supuestos y decisiones (AQuA) [VERIFICADO: gov.uk]
- **Registro de supuestos**: para cada supuesto, qué es, su efecto en el resultado y su fiabilidad, cuándo y por qué se tomó, quién lo tomó y **quién lo validó**.
- **Registro de decisiones**: qué se decidió, cuándo, por qué, quién y quién lo aprobó.
- **Registro de datos**: qué datos se recibieron o derivaron, su riesgo y quién los aprobó.
- **Control de versiones**: qué cambió, por qué, cuándo y quién.
- **Verificación** («¿está bien construido?») frente a **validación** («¿es el análisis que se necesitaba?»). [VERIFICADO: AQuA, capítulo 2]
- **Roles** (AQuA 2025): **quien encarga** (*commissioner*: pide el análisis y lo acepta como válido), **quien analiza** (*analyst*: diseña, construye y revisa su propio trabajo), **quien revisa** (*assurer*: comprueba de forma **independiente**; no puede ser la misma persona que analiza) y **quien aprueba** (*approver*). En una pyme, la alumna será a menudo analista y tendrá que **pedir** un revisor. [VERIFICADO: gov.uk]

### 6.5 Comprobar antes de entregar
Lista de §2.3, más: **dejarlo reposar** y revisarlo al día siguiente, revisarlo con otra persona (63 % → 83 % de errores detectados en equipo; Panko) y **explicar cada cifra clave en voz alta** («la regla de los 24 segundos» de FAST aplicada a los resultados).

### 6.6 Presentar a dirección
- **Una página. La conclusión primero.** Estructura propuesta (inspirada en el «principio de la pirámide» de Barbara Minto [VERIFICADO: https://www.barbaraminto.com/ — libro «The Minto Pyramid Principle: Logic in Writing, Thinking and Problem Solving»; las ideas se presentan como una pirámide bajo una sola idea principal]):
  1. **Titular con la respuesta** («Las ventas de octubre caen un 8 % por la zona Norte; el resto crece»).
  2. Tres mensajes clave con su cifra.
  3. Un gráfico simple que demuestre el mensaje principal (ver la línea de gráficos).
  4. **Riesgos y limitaciones** (AQuA: decir qué puede y qué no puede usarse; la incertidumbre) [VERIFICADO: gov.uk].
  5. **Qué se propone o qué decisión se pide.**
  6. Anexo: el detalle y el enlace al libro.
- Redondear para presentar (miles de €, 1 decimal en %), comparar siempre (con el presupuesto, el mes o el año anterior), sin jerga de Excel («he usado BUSCARX» no interesa).

### 6.7 Mantener un informe recurrente
- **Automatizar la entrada** con Power Query (Datos > Actualizar todo) en lugar de copiar y pegar (JPMorgan y TransAlta).
- **Parámetros en `Entradas`**: fecha de corte, mes y año, umbrales.
- **Manual de una página** en el `Léeme` (paso a paso), para que lo actualice otra persona en vacaciones (AQuA: documentación de usuario y técnica, «required for all analysis»).
- **Comprobaciones automáticas** que avisan si el formato de la fuente cambia (columnas, número de filas, total).
- **Registro de ejecuciones** (fecha, quién, filas cargadas, totales, incidencias).
- Archivar las entregas (PDF del mes) y no sobrescribir los datos reales sobre las previsiones (ICAEW).
- Revisar una vez al año si sigue haciendo falta, si se puede simplificar o si hay que pasarlo a otra herramienta (AQuA: «defined lifespan or conditions for validity») [VERIFICADO].

### 6.8 Cuándo pasar a Power BI o a una base de datos (criterios para la guía)
Principio del ICAEW #4: «Identify if a spreadsheet is the right solution, or if another medium should be used». [VERIFICADO]
Señales (síntesis propia, con los límites de Excel VERIFICADOS en https://support.microsoft.com/es-es/office/especificaciones-y-l%C3%ADmites-de-excel-1672b34d-7043-467e-8e27-269d656771c3):
- **Volumen**: se acerca a 1.048.576 filas por hoja, o el libro va lento aunque esté bien hecho. Paso intermedio: Power Query + **modelo de datos** (en 64 bits, sin límite fijo de tamaño; en 32 bits, unos 2 GB de memoria compartida).
- **Muchas fuentes** que hay que combinar cada vez, o necesidad de **actualización programada** sin intervención.
- **Muchas personas consultando** con vistas distintas o **permisos por persona** (p. ej., que cada comercial vea solo lo suyo) → Power BI con **seguridad de nivel de fila (RLS)** [CORREGIDO: https://learn.microsoft.com/es-es/fabric/security/service-admin-row-level-security — el nombre oficial es «seguridad de nivel de fila (RLS)»; los roles se definen en Power BI Desktop con filtros DAX, y solo restringe a quien tiene permiso de Visor, no a administradores, miembros ni colaboradores del área de trabajo].
- **Muchas personas escribiendo datos a la vez** (altas, pedidos, horas) → formulario, aplicación o base de datos, no una hoja compartida.
- **Proceso regulado o auditado** (facturación → SIF o VERI\*FACTU; nóminas → software de nóminas; contabilidad → ERP).
- **Un error tendría consecuencias graves** y hacen falta trazabilidad y controles que Excel no da.
- Mensaje: Excel sigue siendo el **«taller»** (análisis, prototipos, cuadres) y la puerta de entrada a Power BI (mismo Power Query y mismo modelo de datos).

---

## 7. Propuestas concretas para la guía

### 7.1 Dónde encaja cada bloque en los niveles de `curriculo.md`
| Nivel | Contenido de esta línea |
|---|---|
| N0–N1 | Regla «los códigos son texto»; guardar en OneDrive; nombre de archivo; IVA y retención como ejemplos de fórmulas (`=Base*TipoIVA` con la celda del tipo aparte, nunca `*0,21`) |
| N2 | Entradas, cálculos y salidas; sin números a mano; Tablas; validación; proteger hoja (y que no es seguridad); comentarios y notas; Rastrear precedentes; factura con IVA, recargo y retención |
| N3 | Hoja de comprobaciones y maestra; Comprobación de errores, Evaluar fórmula, Ventana Inspección; importar CSV y Norma 43 con Power Query; antigüedad de la deuda; presupuesto frente a real |
| N4 | Coautoría, historial de versiones, vínculos; Inspeccionar documento y datos ocultos; RGPD aplicado; rendimiento; Inquire o comparación de versiones |
| N5 | Informe recurrente automatizado; conciliación bancaria; cuándo pasar a Power BI |
| N6 | Ficha de encargo, estimación, registro de supuestos, revisión, presentación de una página, manual de mantenimiento: el ciclo completo con la rúbrica de `curriculo.md` |

### 7.2 Libros .xlsx descargables (propuesta)
1. `Caza_el_error.xlsx`: 8 hojas con un error cada una (rango corto, suma frente a media, signo, columna ordenada sola, número a mano, fórmula inconsistente, código sin ceros, fecha convertida) y una hoja de soluciones protegida.
2. `Publicar_sin_sustos.xlsx`: hoja oculta con DNI ficticios, tabla dinámica con caché, filtro activo, vínculo externo roto, comentario con un nombre y propiedades con autor. Tarea: dejarlo listo para enviar.
3. `Extracto_N43.txt` + `Mayor_572.xlsx`: conciliación bancaria de un mes con 6 partidas pendientes.
4. `Export_ERP_sucio.csv` (ANSI, `;`, subtotales, signo menos al final, códigos con ceros): importación con Power Query y cuadre.
5. `Facturas_2026.xlsx`: series, rectificativas, IVA 21/10/4, recargo, retenciones del 15 y del 7 %, un hueco en la numeración y un IVA temporal del 10 % en marzo: comprobar.
6. `Plantilla_modelo.xlsx`: Léeme, Entradas, Datos, Cálculos, Informe y Comprobaciones, con estilos y leyenda: la base de todos los proyectos.

### 7.3 Ideas de preguntas de test (con la respuesta correcta y la explicación)
1. Proteges una hoja con contraseña. ¿Están seguros los datos? → **No**: Microsoft dice que la protección de hoja no es una característica de seguridad; para impedir que se lea, Cifrar con contraseña.
2. En 85 hojas reales inspeccionadas a fondo, ¿qué porcentaje tenía errores? → **94 %**.
3. Un profesional factura 2.000 € de base al 21 % con una retención del 15 %. ¿Total a pagar? → 2.000 + 420 − 300 = **2.120 €**.
4. ¿Por qué no se pone `=B2*0,21`? → El tipo puede cambiar (en 2026 hubo tipos temporales) y se aplica el vigente en el devengo: va en una celda o tabla de entradas.
5. PHE perdió 15.841 casos porque… → la plantilla usaba **.xls (máx. 65.536 filas)** y lo que no cabía se perdía sin aviso.
6. ¿Qué detecta pero NO quita el Inspector de documento? → La caché de las tablas dinámicas, los vínculos externos, las macros y los nombres ocultos, entre otros.
7. Envías por error a un cliente un Excel con datos de otros clientes. ¿Qué haces? → Avisar enseguida al responsable de protección de datos: es una brecha y puede haber que notificarla en 72 horas.
8. Una hoja de Excel en la que solo escribes e imprimes tus facturas, ¿es un SIF según la AEAT? → No; sí lo sería si con macros generara el libro registro.
9. ¿Qué gana si dos personas cambian la misma celda a la vez en coautoría? → El último cambio guardado.
10. ¿Qué diferencia hay entre una nota y un comentario? → El comentario es una conversación (se responde, se resuelve y avisa con @menciones); la nota es una anotación fija.
11. ¿Por qué la fecha de corte va en una celda y no se usa HOY() en cada fila? → HOY es volátil (recalcula siempre) y el informe no se podría repetir para otra fecha.
12. Un revisor solo encuentra de media ~60 % de los errores. ¿Qué hacer con un informe importante? → Revisión independiente o en equipo (83 % con tres personas) y comprobaciones automáticas.

### 7.4 Tarjetas de repaso (anverso → reverso)
- CER → tasa de error por celda; 1–5 % (media de laboratorio, 3,9 %).
- Tres tipos de error → mecánico, lógico, omisión.
- Rule of thumb (FAST) → ninguna fórmula más larga que el pulgar.
- Rule of seconds (FAST) → ninguna fórmula que tarde más de 24 segundos en explicarse.
- Hardcoding → número fijo dentro de una fórmula (p. ej., 21 % del IVA).
- Comprobación maestra → una celda que dice si TODAS las comprobaciones están bien.
- Ctrl+` → mostrar fórmulas. Ctrl+Fin → última celda usada. F5 → Ir a.
- Flechas rojas al rastrear → celdas que provocan un error.
- Funciones volátiles → AHORA, HOY, ALEATORIO.ENTRE, DESREF, INDIRECTO, CELDA, INFO.
- Tipos de IVA → 21 / 10 / 4 (y 0 en casos concretos).
- Recargo de equivalencia → 5,2 / 1,4 / 0,5 / 1,75 (tabaco).
- Retención de un profesional → 15 % (7 % el año de inicio y los 2 siguientes); alquiler, 19 %.
- Factura simplificada → hasta 400 € con IVA (3.000 € en algunos sectores).
- Plazo para facturar a una empresa → antes del día 16 del mes siguiente.
- VERI\*FACTU → 1/1/2027 (sociedades) y 1/7/2027 (resto), según el RDL 15/2025: comprobar si ha cambiado.
- Factura electrónica entre empresas → 6/10/2027 (más de 8 M€) y 6/10/2028 (resto).
- Brecha de datos → notificar a la AEPD en 72 h como máximo.
- Minimización → solo los datos necesarios.
- Norma 43 → registros de 80 caracteres; 11 cabecera, 22 movimiento, 33 final de cuenta, 88 fin de fichero.
- Límite de filas → 1.048.576 (.xlsx); 65.536 (.xls antiguo).
- Precisión → 15 dígitos (el IBAN y las tarjetas, como texto).
- AQuA: roles → quien encarga, quien analiza, quien revisa (independiente) y quien aprueba.
- Verificación frente a validación → ¿está bien hecho? frente a ¿es lo que se necesitaba?

### 7.5 Criterios extra para la rúbrica de los proyectos (complementan la de `curriculo.md`)
- **Estructura** (FAST/ICAEW): Léeme, Entradas, Datos, Cálculos, Informe y Comprobaciones; flujo de izquierda a derecha; nada oculto.
- **Sin números a mano**: 0 constantes que puedan cambiar dentro de las fórmulas (se comprueba con Ir a > Especial > Constantes).
- **Consistencia**: 0 avisos de «fórmula incoherente».
- **Controles**: al menos cuadre de filas y de importe con la fuente, más la comprobación maestra visible.
- **Privacidad**: datos minimizados o seudonimizados; Inspector pasado; permisos correctos.
- **Fiscalidad bien aplicada** (si el caso la tiene): tipos parametrizados con fechas; retención sobre la base.
- **Comunicación**: resumen de una página con la conclusión primero y sus limitaciones.

---

## 8. Alertas (lo que el temario no debe olvidar o debe tratar con cuidado)

1. **VERI\*FACTU puede volver a cambiar**: las fechas vigentes (1/1/2027 y 1/7/2027) son las del RDL 15/2025, pero el Ministerio de Hacienda publicó el **05/10/2026 una «previsión de ampliación del plazo»** que no se pudo leer. **Comprobar antes de publicar** y escribir siempre «a fecha de…».
2. **«Facturar con Excel»**: según la AEAT, no es un SIF si solo sirve para escribir, imprimir y guardar, pero **sí con macros que generan los libros registro**, y **no se puede mezclar** con la facturación manual. Además, la **factura electrónica entre empresas** será obligatoria desde el 6/10/2027 o el 6/10/2028. La guía **no debe enseñar a montar un sistema de facturación en Excel**.
3. **Los tipos de IVA cambian durante el año** (10 % temporal en energía y carburantes del 22/03 al 31/05 o al 30/06/2026). Enseñar la tabla de tipos **con fechas de vigencia** y el principio del «tipo vigente en el devengo».
4. **PHE no fue «el límite de un millón de filas»**: fue el formato **.xls de 65.536 filas** (Wikipedia lo cuenta mal). Precisión en los casos.
5. **Los estándares chocan con el Excel moderno**: el ICAEW (2024) y FAST (2019) dicen «no uses fórmulas matriciales» y FAST «no uses nombres». Explicar que se referían a las fórmulas antiguas con Ctrl+Mayús+Intro; las matrices dinámicas se enseñan con criterio (el marco del ICAEW de 2026 ya las incluye).
6. **No hay un código de colores universal** (FAST: azul = lo que llega de otra hoja; banca: azul = entrada; ICAEW: relleno o borde, no solo la fuente). Elegir uno y **poner siempre la leyenda**.
7. **Proteger la hoja no es seguridad; ocultar no es proteger**; el Inspector **no quita la caché de las tablas dinámicas, los vínculos externos ni los nombres ocultos**. Los casos PSNI (750.000 £) y MoD lo demuestran.
8. **Las cifras de Panko**: usar las de 2015/2016 (94 % de 85 hojas; CER del 3,9 %; 60 % detectado), no mezclarlas con el 88 % de versiones antiguas.
9. **Muchos casos famosos solo constan en prensa** (Fidelity, TransAlta, Kodak, MI5, Lazard, Crypto.com, Columbia Británica). Presentarlos como «según la prensa» y no inventar detalles.
10. **Coste de empresa ≈ bruto × 1,31 + accidentes de trabajo** solo es orientativo (bases mínima y máxima, cotización de solidaridad, prorrateo de pagas). **Nunca presentar Excel como herramienta para hacer nóminas.**
11. **HyperFormula esES** no tiene INDIRECTO ni SIFECHA (DATEDIF aparece sin traducir) y DIAS aparece como «DÍAS»: los ejercicios de antigüedad de deuda en la hoja en vivo deben **restar fechas**. Inquire y Comparar hojas de cálculo solo existen en Microsoft 365 para empresas en Windows.
12. **IA**: ya está cubierta en `excel-moderno.md` §4.3. Recordar que en la empresa solo se usa la herramienta autorizada, sin datos personales en IA personales, y que todo resultado se comprueba y se anota.
13. **Sin comprobar por falta de cupo de búsquedas**: Vista de hoja; nombres en español de Comprobar rendimiento, Vínculos del libro, Comparar hojas de cálculo y estilos de celda; opciones de enlace para compartir; Ley 3/2004 (30/60 días); plazos de conservación de facturas (4 y 6 años); los n.º 1–3, 6, 10, 16 y 19 de los 20 principios del ICAEW. Revisarlos antes de redactar las lecciones.

---

## 9. Fuentes consultadas (14/11/2026)

**Riesgo y estudios**
- Panko, R. (2015/2016). *What We Don't Know About Spreadsheet Errors Today*. EuSpRIG 2015. https://arxiv.org/pdf/1602.02601 [texto completo leído]
- Panko, R. (2000/2008). *Spreadsheet Errors: What We Know. What We Think We Can Do*. https://arxiv.org/pdf/0802.3457 [extracto]
- Abeysooriya, M. et al. (2021). *Gene name errors: Lessons not learned*. PLoS Comput Biol 17(7). https://pmc.ncbi.nlm.nih.gov/articles/PMC8357140
- ICO (23/05/2024). Multa a la PSNI. https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/05/psni-facing-a-750k-fine-following-spreadsheet-error-that-exposed-the-personal-information-of-its-entire-workforce/
- ICO (31/07/2025). *Disclosing documents to the public securely* y lista sobre hojas de cálculo. https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/07/new-guidance-on-disclosing-documents-to-the-public/ · https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/security/disclosing-documents-to-the-public-securely/checklist-avoid-an-accidental-breach-when-personal-information-is-hidden-in-spreadsheets/
- Prensa de los casos: Deseret News (1994), The Register (2003), Petroleum News (2003), Finextra y ABA Journal (2008), Retraction Watch y LSE (2013), R-bloggers e IFRE (2013), gov.uk sobre la investigación Laidlaw (2012), The Scotsman y Audit Scotland (2019), DigitalHealth y UKAuthority (2020), Civil Service World (2025), Global News y CTV (09/2026), Economist & Jurist (2024–2025). Las URL están en la tabla de §1.3.
- Wikipedia, «List of spreadsheet mistakes» (editada en 11/2026), solo como índice: https://en.wikipedia.org/wiki/List_of_spreadsheet_mistakes

**Estándares**
- FAST Standard 02c (julio de 2019). https://www.stl-training.co.uk/download/forum/40296_FAST-Standard-02c-July-2019.pdf (copia del original de fast-standard.org)
- ICAEW, *Financial Modelling Code* (© 2024). https://www.icaew.com/-/media/corporate/files/technical/technology/excel-community/financial-modelling-code.ashx
- HM Treasury y Analysis Function, *The AQuA Book* (edición revisada, 30/07/2025). https://www.gov.uk/government/publications/the-aqua-book-guidance-on-producing-quality-analysis-for-government · borrador: https://best-practice-and-impact.github.io/aqua_book_revision

**Microsoft**
- Protección y seguridad en Excel: https://support.microsoft.com/es-es/excel/protection-and-security-in-excel
- Proteger una hoja: https://support.microsoft.com/es-es/office/proteger-una-hoja-de-c%C3%A1lculo-3179efdb-1285-4d49-a9c3-f4ca36276de6
- Proteger un archivo: https://support.microsoft.com/es-es/Excel/get-started/protect-an-excel-file
- Relaciones entre fórmulas y celdas: https://support.microsoft.com/es-ES/Excel/display-the-relationships-between-formulas-and-cells
- Detectar errores en fórmulas (comprobación de errores, Evaluar fórmula, Ventana Inspección): https://support.microsoft.com/es-es/excel/detect-formula-errors-in-excel
- Inquire: https://support.microsoft.com/en-US/Excel/turn-on-the-inquire-add-in
- Rendimiento: https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-tips-for-optimizing-performance-obstructions (11/11/2025) · Recálculo y funciones volátiles: https://learn.microsoft.com/en-us/office/client-developer/excel/excel-recalculation
- Check Performance: https://support.microsoft.com/en-us/excel/cleanup-cells-in-your-workbook
- Coautoría: https://support.microsoft.com/es-es/Excel/get-started/collaborate-on-excel-workbooks-at-the-same-time-with-co-authoring
- Comentarios y notas: https://support.microsoft.com/es-es/office/the-difference-between-threaded-comments-and-notes-75a51eec-4092-42ab-abf8-7669077b7be3
- @menciones: https://support.microsoft.com/es-es/office/usar-menciones-para-etiquetar-a-alguien-para-recibir-comentarios-644bf689-31a0-4977-a4fb-afe01820c1fd
- Vínculos entre libros: https://support.microsoft.com/en-us/office/find-links-external-references-in-a-workbook-fcbf4576-3aab-4029-ba25-54313a532ff1
- Inspector de documento: https://support.microsoft.com/es-es/office/quitar-datos-ocultos-e-informaci%C3%B3n-personal-inspeccionando-documentos-presentaciones-o-libros-356b7b5d-77af-44fe-a07f-9aa4d085966f
- Especificaciones y límites: https://support.microsoft.com/es-es/office/especificaciones-y-l%C3%ADmites-de-excel-1672b34d-7043-467e-8e27-269d656771c3
- Opciones de importación y conversión automática: https://support.microsoft.com/es-es/Excel/data-import-and-analysis-options-in-excel
- Importar y exportar texto o CSV: https://support.microsoft.com/es-es/office/importar-o-exportar-archivos-de-texto-txt-o-csv-5250ac4c-663c-47ce-937b-339e391393ba
- CSV UTF-8: https://support.microsoft.com/es-es/office/abrir-archivos-csv-utf-8-correctamente-en-excel-8a935af5-3416-4edd-ba7e-3dfd2bc4a032

**España: fiscalidad, laboral y datos**
- AEAT, SIF y VERI\*FACTU (actualizada el 03/11/2026): https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html · nota de ampliación de plazos: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html · FAQ de ámbito (Excel y Word, 4 «NO»): https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-ambitos-aplicacion.html · comunicación de Hacienda (05/10/2026, no leída): https://www.hacienda.gob.es/sgt/gabsehacienda/nota-informativa-verifactu.pdf
- AEAT, factura electrónica, calendario: https://sede.agenciatributaria.gob.es/Sede/iva/factura-electronica/calendario-implantacion.html · RD 238/2026: https://www.boe.es/buscar/act.php?id=BOE-A-2026-7295 · Orden HAC/1028/2026: https://www.boe.es/buscar/act.php?id=BOE-A-2026-20587
- AEAT, Tipos de IVA 2026 (PDF del 02/06/2026): https://sede.agenciatributaria.gob.es/static_files/Sede/Tema/IVA/IVA_reperc/Tipos_IVA_2026.pdf
- Ley 37/1992 del IVA (arts. 90, 91, 154 y 161): https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740
- RD 1619/2012, Reglamento de facturación (arts. 4, 6, 11 y 19): https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696
- RD 439/2007, Reglamento del IRPF (arts. 95, 100 y 101): https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820
- Seguridad Social, bases y tipos 2026: https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/36537 · LGSS (MEI y solidaridad): https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724
- PGC (RD 1514/2007), cuadro de cuentas: https://www.boe.es/buscar/act.php?id=BOE-A-2007-19884
- RGPD (arts. 5, 32 y 33): https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807 · LOPDGDD (arts. 5 y 87): https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- Norma 43, Cuaderno 43 (AEB, CECA y UNACC, junio de 2012), copia de CaixaBank: https://www.caixabank.es/deployedfiles/empresas/Estaticos/pdf/Transferenciasyficheros/q43Junio2012.pdf
- Odoo 18, exportar e importar datos: https://www.odoo.com/documentation/18.0/applications/essentials/export_import_data.html
- Economist & Jurist, sanciones de la AEPD: https://www.economistjurist.es/?p=229395 · https://www.economistjurist.es/?p=213960 · https://www.economistjurist.es/?p=221341

Archivos de trabajo guardados (PDF y HTML descargados para extraer el texto): `raw/empresa/` (panko2016.txt, fmc.txt, fast02c.txt, tiposiva2026.txt, n43.txt, liva.html, rf.html, rirpf.html, lgss.html, lopdgdd.html, rgpd_boe.html, pgc.html).
