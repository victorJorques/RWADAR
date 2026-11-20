# Currículo, niveles y certificación · Guía de Excel de nivel 0 a autonomía en empresa

Línea de investigación: currículo, niveles y certificación.
Fecha de la investigación: 14/11/2026. Configuración objetivo: Excel en español (es-ES), separador `;`, decimal `,`, fechas DD/MM/AAAA, euros.

Leyenda: **[VERIFICADO: url]** = comprobado en fuente primaria (página o PDF oficial leídos el 14/11/2026). **[CORREGIDO: url]** = el dato original era incorrecto o impreciso y se ha corregido con esa fuente primaria. **[NO VERIFICABLE: no enseñarlo como dato]** = no se ha podido comprobar en fuente primaria (fuente secundaria, extracto de buscador o deducción propia), así que no se enseña a la alumna como dato.

---

## 0. Resumen para quien diseña el temario (lo esencial en 12 puntos)

1. **MO-210 (Excel Associate) y MO-211 (Excel Expert) siguen vigentes** en noviembre de 2026, sin fecha de retirada. Sus objetivos oficiales son los de **octubre de 2022** y no se han actualizado. [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-associate-m365-apps/ (actualizada 31/07/2026) y https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-211/ (actualizada 01/07/2026, «Retirement date: none»)]
2. **Hay dos certificaciones MOS nuevas por puesto (role-based)**: **MO-220 Excel for Accounting Associate** y **MO-230 Excel for Business Finance Associate**. Duran 50 min, son de nivel «Intermediate» y **solo se ofrecen en inglés**. [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-accounting-associate/ y https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-business-finance-associate/]
3. **MOS 2016 se retiró el 30/06/2026.** MO-200 y MO-201 (Office 2019) siguen publicadas sin fecha de retirada. [VERIFICADO: https://certiport.pearsonvue.com/Blog/2026/February/Stay-connected-Exam-retirement-updates y páginas de learn.microsoft.com de MO-200 y MO-201, actualizadas 03/08/2026]
4. **El examen MOS no es un test de preguntas.** Se hace dentro de Excel («Live-in-the-Application») en 50 minutos, sin pausas, y las instrucciones **no dicen el nombre de la función**: describen lo que hay que conseguir. [VERIFICADO: https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience y PDF oficial del MO-210]. Conclusión para la guía: hay que entrenar enunciados «tipo MOS», que piden un resultado sin decir qué función usar.
5. **MOS se queda corto para la empresa de 2026.** No cubre Power Query como herramienta de transformación (solo «importar datos»), Power Pivot/DAX, LAMBDA, funciones de matriz recientes, coautoría, Copilot ni buenas prácticas de diseño y control. Para «desenvolverse sola» la guía debe ir más allá del MO-211.
6. **En las ofertas españolas, «Excel avanzado» casi nunca se concreta.** En una muestra de 20 ofertas de Jooble (noviembre de 2026), solo 1 detallaba algo («tablas dinámicas»). Cuando sí se concreta, el núcleo es este: **tablas dinámicas, fórmulas (búsquedas tipo BUSCARV/BUSCARX y condicionales), filtros, gráficos e informes**. Las **macros aparecen casi siempre como «valorable»**. **Power Query y Power BI** aparecen en puestos de analista o de controller. Excel va casi siempre junto a un **ERP** (SAP, Navision/Business Central, Contaplus, A3…).
7. **No existe un estudio público y cuantitativo** de qué funciones piden las ofertas en España. InfoJobs bloquea la lectura automática. Lo que hay son muestras propias y datos de terceros, todos marcados en este documento.
8. **Las pruebas de selección son de cuatro tipos:** (a) test online de 5 a 12 minutos con preguntas de opción múltiple (TestGorilla, Criteria); (b) simulación interactiva de unos 25 a 35 minutos (SHL, Kenexa); (c) **prueba práctica con un archivo de datos de 30 a 60 minutos**, la más habitual en administración y análisis; (d) caso o modelo financiero de 60 a 180 minutos. En las oposiciones hay test de unas 40 preguntas en 45 minutos y supuestos prácticos de 30 minutos.
9. **Marcos de niveles de referencia.** **DigComp 3.0** (UE, noviembre de 2025) tiene 4 niveles: Básico, Intermedio, Avanzado y Muy avanzado. **ICAEW Spreadsheet Competency Framework**, 2.ª edición (02/07/2026), tiene 4 niveles (Basic, General, Creator, Developer), 82 competencias y 6 nuevas sobre IA, y recomienda que **quien diseñe hojas para una organización tenga como mínimo el nivel Creator**.
10. **Propuesta: 7 niveles (del 0 al 6).** Cada nivel corresponde a un umbral que el mercado reconoce: nivel 0, cero absoluto; nivel 1, «nivel usuario»; nivel 2, «intermedio», equivalente a MO-210; nivel 3, el «Excel avanzado» de las ofertas; nivel 4, experto, equivalente a MO-211 más Power Query; nivel 5, modelado, automatización y cuadros de mando; nivel 6, autonomía en proyectos completos (equivale a ICAEW Creator).
11. **Horas.** Microsoft estima unas 150 horas por examen MOS, tanto para Associate como para Expert. Para llegar del nivel 0 al 6 se calculan de forma realista entre 250 y 350 horas de estudio con práctica, más los proyectos.
12. **Error documentado.** Panko encontró errores en al menos el **86 %** de las hojas auditadas con buenos métodos. Por eso la comprobación (cuadres, controles, revisión) tiene que ser una competencia evaluada en todos los niveles, no un tema suelto. [VERIFICADO parcialmente, extracto de https://arxiv.org/pdf/0802.3457]

---

## 1. Certificaciones oficiales de Microsoft (MOS) a 14/11/2026

### 1.1 Estado de cada examen

| Examen | Nombre | Nivel Microsoft | Estado (14/11/2026) | Idiomas | Duración | Renovación |
|---|---|---|---|---|---|---|
| **MO-210** | Microsoft Office Specialist: Excel Associate (Microsoft 365 Apps) | Intermediate | Vigente, sin retirada anunciada; página actualizada el 31/07/2026 | Inglés, **español** y otros 13 | 50 min | 60 meses |
| **MO-211** | Microsoft Office Specialist: Excel Expert (Microsoft 365 Apps) | Advanced | Vigente, «Retirement date: none»; página actualizada el 01/07/2026 | Página de la certificación: inglés, chino, francés, alemán, japonés y **español**. Página del examen: «Languages: English» (**se contradicen**) | 50 min | 60 meses |
| **MO-220** | MOS: Excel for Accounting Associate | Intermediate | Vigente; página actualizada el 17/09/2026; temario del 12/09/2025 | **Solo inglés** | 50 min | 60 meses |
| **MO-230** | MOS: Excel for Business Finance Associate | Intermediate | Vigente; página actualizada el 31/07/2026 | **Solo inglés** | 50 min | 60 meses |
| MO-200 / MO-201 | Excel (Office 2019) / Excel Expert (Office 2019) | — | Publicadas, «Retirement date: none»; actualizadas el 03/08/2026 | — | 50 min | — |
| MOS 2016 (77-727 y otros) | Office 2016 | — | **Retiradas el 30/06/2026** | — | — | — |
| PL-300 (para seguir después) | Microsoft Certified: Power BI Data Analyst Associate | — | Vigente; actualizada el 05/11/2026 | Incluye español | 100 min | **12 meses** |

Fuentes:
- MO-210: [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-associate-m365-apps/]. La dirección del examen (`/exams/mo-210/`) redirige a esa página.
- MO-211: [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-211/ y https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-expert-m365-apps/]
- MO-220: [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-accounting-associate/]. Temario: [VERIFICADO: https://arch-center.azureedge.net/Credentials/exam-mo-220-mos-excel-for-accounting-associate.pdf]
- MO-230: [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-business-finance-associate/]. Objetivos en español publicados por PUE (PDF del 17/11/2025): [VERIFICADO: https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-365-business-finance-associate/es]
- Retirada de MOS 2016: [VERIFICADO: https://certiport.pearsonvue.com/Blog/2026/February/Stay-connected-Exam-retirement-updates] (entrada del 04/02/2026)
- PL-300: [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/]

**¿Hace falta el MO-210 para tener el título de Excel Expert?** No. Un moderador de Microsoft (25/01/2026) aclara que con aprobar el MO-211 se obtiene el certificado y la insignia de Excel Expert. El requisito previo del Associate solo cuenta para la credencial de programa «MOS Expert», que combina varias aplicaciones. [VERIFICADO: https://learn.microsoft.com/en-us/answers/questions/5738147/is-the-microsoft-office-specialist-excel-expert-ti]. En ese mismo hilo, una respuesta generada por IA dice lo contrario; no hay que tenerla en cuenta.

### 1.2 Cómo es el examen MOS (para imitarlo en la guía)

- **Duración:** 50 minutos de examen y 60 de sesión. **No se permiten pausas** en los MOS. Tampoco se puede consultar Microsoft Learn durante el examen. [VERIFICADO: https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience]
- **Formato:** se trabaja dentro de Excel («Live-in-the-Application»), en varios proyectos. [VERIFICADO: misma URL y PDF del MO-210]
- **Enunciados:** «Las instrucciones de las tareas generalmente no incluyen el nombre del comando… los nombres de funciones se evitan y se reemplazan con descriptores». [VERIFICADO: PDF de objetivos del MO-210 y el MO-211 en inglés y en español]. Ejemplo de cómo trasladarlo a la guía: en lugar de «usa CONTAR.BLANCO», el enunciado diría «indica en B20 cuántos clientes no tienen teléfono».
- **Corrección:** se puntúa el estado final del archivo, no los pasos que se siguieron; si una tarea se puede hacer de varias formas, todas las correctas puntúan [VERIFICADO: https://certiport.pearsonvue.com/About/Developing-a-certification-examination/Certification-examination-FAQs].
- **Nota mínima:** 700 en una escala de 1 a 1.000. Es una puntuación escalada, así que no equivale exactamente al 70 % de aciertos [VERIFICADO: https://certiport.pearsonvue.com/About/Developing-a-certification-examination/Certification-examination-FAQs]. Microsoft Learn solo dice que los exámenes de Office se puntúan de 1 a 1.000 y que la nota necesaria depende del examen [VERIFICADO: https://learn.microsoft.com/en-us/credentials/certifications/exam-scoring-reports].
- **Repetición:** se puede volver a presentar 24 horas después del primer intento; los plazos de los siguientes intentos varían. [VERIFICADO: página de la certificación MO-210]
- **Horas de preparación:** «aproximadamente 150 horas de formación y experiencia práctica» tanto para el Associate como para el Expert. [VERIFICADO: páginas de MO-210 y MO-211]
- **Tipos de libro de ejemplo.** MO-210: «presupuestos, estados financieros, gráficos de desempeño del equipo, facturas de ventas y registros de entrada de datos». MO-211: «plantillas comerciales personalizadas, gráficos financieros de varios ejes, tablas de amortización y cronogramas de inventario». [VERIFICADO]. **Sirven como temas de los casos prácticos de la guía.**
- **Precio en España:** Microsoft solo indica «Price based on the country or region». No he encontrado un precio oficial en euros [NO VERIFICABLE: no enseñarlo como dato]. Hay cursos con examen incluido desde unos 100 € (Inesem) [NO VERIFICABLE: no enseñarlo como dato].
- **Simulacros:** los gestiona Certiport (GMetrix). Microsoft ofrece un «Exam Sandbox» para conocer la interfaz. [VERIFICADO: páginas de MO-220/MO-230 y exam-duration]

### 1.3 MO-210 · Excel Associate: objetivos oficiales completos

Fuente: PDF oficial de Microsoft «Exam MO-210: Microsoft Excel (Microsoft 365 Apps) – Skills Measured», creado el 24/10/2022 [VERIFICADO: https://arch-center.azureedge.net/Learning/Credentials/microsoft-certified-security-operations-analyst-skills-measured.pdf]. **Ojo: el nombre del archivo es erróneo** (dice «security-operations-analyst»), pero el contenido es el del MO-210. La versión en español de Certiport/PUE es de 2022 [VERIFICADO: https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-excel-365/es]. Al comparar las dos versiones, **la de PUE omite «Aplicar estilos de celda»**.

Nombres de funciones en español es-ES entre paréntesis [VERIFICADO: https://support.microsoft.com/es-es/excel/excel-functions-alphabetical y las páginas de cada función en support.microsoft.com/es-es/excel/functions/].

**1. Administrar hojas de cálculo y libros (25–30 %)**
- 1.1 Importar datos a libros: importar desde archivos de texto (TXT/CSV); importar desde fuentes en línea.
- 1.2 Navegar por los libros: buscar datos en un libro; ir a celdas, rangos o elementos con nombre; insertar y quitar hipervínculos.
- 1.3 Dar formato a hojas y libros: configurar la página; ajustar alto de fila y ancho de columna; personalizar encabezados y pies de página.
- 1.4 Personalizar opciones y vistas: barra de herramientas de acceso rápido; mostrar y modificar hojas en distintas vistas; inmovilizar filas y columnas; cambiar vistas de ventana; modificar las propiedades del libro; mostrar fórmulas.
- 1.5 Preparar libros para colaborar y distribuirlos: establecer el área de impresión; guardar y exportar en otros formatos; configurar la impresión; inspeccionar el libro y corregir problemas; gestionar comentarios y notas.

**2. Administrar celdas y rangos de datos (25–30 %)**
- 2.1 Manipular datos: pegado especial; rellenar con el controlador de relleno (Autorrelleno); insertar y eliminar varias filas o columnas; insertar y eliminar celdas; generar datos numéricos con RANDBETWEEN (ALEATORIO.ENTRE) y SEQUENCE (SECUENCIA).
- 2.2 Dar formato a celdas y rangos: combinar y separar celdas; alineación, orientación y sangría; Copiar formato; ajustar texto; formatos de número; formatos desde el cuadro de diálogo Formato de celdas; **estilos de celda**; borrar formato; dar formato a varias hojas agrupándolas.
- 2.3 Definir rangos con nombre y hacer referencia a ellos.
- 2.4 Resumir datos de forma visual: minigráficos; formato condicional integrado; quitar formato condicional.

**3. Administrar tablas y sus datos (10–15 %)**
- 3.1 Crear tablas de Excel a partir de rangos; aplicar estilos de tabla; convertir tablas en rangos.
- 3.2 Agregar o quitar filas y columnas de una tabla; configurar las opciones de estilo; insertar y configurar la fila de totales.
- 3.3 Filtrar registros; ordenar por varias columnas.

**4. Realizar operaciones con fórmulas y funciones (15–20 %)**
- 4.1 Referencias relativas, absolutas y mixtas; referencias estructuradas en fórmulas.
- 4.2 Calcular y transformar: AVERAGE (PROMEDIO), MAX, MIN, SUM (SUMA); COUNT (CONTAR), COUNTA (CONTARA), COUNTBLANK (CONTAR.BLANCO); IF (SI); SORT (ORDENAR); UNIQUE (UNICOS).
- 4.3 Texto: RIGHT (DERECHA), LEFT (IZQUIERDA), MID (EXTRAE); UPPER (MAYUSC), LOWER (MINUSC), LEN (LARGO); CONCAT (CONCAT), TEXTJOIN (UNIRCADENAS).

**5. Administrar gráficos (15–20 %)**
- 5.1 Crear gráficos; crear hojas de gráfico.
- 5.2 Agregar series de datos; cambiar filas por columnas en los datos de origen; agregar y modificar elementos del gráfico.
- 5.3 Aplicar diseños de gráfico; aplicar estilos; **agregar texto alternativo para la accesibilidad**.

Otras fuentes dan pesos distintos (por ejemplo, 10–15 % para hojas y libros). **Hay que usar los del PDF oficial** de esta sección.

### 1.4 MO-211 · Excel Expert: objetivos oficiales completos

Fuente: [VERIFICADO: https://arch-center.azureedge.net/Learning/Credentials/MO-211_OD_MOS365_ExcelExpert.pdf] y su versión en español de PUE [VERIFICADO: https://pue.es/pue-academy/certiport/examenes/objetivos/mos-excel-expert-365/es]. **La traducción de PUE tiene errores**: dice «marcos» en lugar de «macros» y «Habilidades medias» en lugar de «medidas».

**1. Administrar opciones y configuración del libro (10–15 %)**
- 1.1 Administrar libros: copiar macros entre libros; hacer referencia a datos de otros libros; habilitar macros; administrar versiones del libro.
- 1.2 Preparar libros para colaborar: restringir la edición; proteger hojas y rangos de celdas; proteger la estructura del libro; configurar las opciones de cálculo de fórmulas.

**2. Administrar y dar formato a los datos (30–35 %)**
- 2.1 Rellenar celdas a partir de datos existentes: Relleno rápido; opciones avanzadas de Rellenar serie; RANDARRAY (MATRIZALEAT).
- 2.2 Dar formato a los datos y validarlos: formatos de número personalizados; validación de datos; agrupar y desagrupar (esquemas); subtotales y totales; quitar duplicados.
- 2.3 Formato condicional y filtrado avanzados: reglas personalizadas; reglas con fórmulas; administrar reglas.

**3. Crear fórmulas y macros avanzadas (25–30 %)**
- 3.1 Operaciones lógicas con funciones anidadas: IF (SI), IFS (SI.CONJUNTO), SWITCH (CAMBIAR), SUMIF (SUMAR.SI), AVERAGEIF (PROMEDIO.SI), COUNTIF (CONTAR.SI), SUMIFS (SUMAR.SI.CONJUNTO), AVERAGEIFS (PROMEDIO.SI.CONJUNTO), COUNTIFS (CONTAR.SI.CONJUNTO), MAXIFS (MAX.SI.CONJUNTO), MINIFS (MIN.SI.CONJUNTO), AND (Y), OR (O), NOT (NO) y **LET**.
- 3.2 Buscar datos: XLOOKUP (BUSCARX), VLOOKUP (BUSCARV), HLOOKUP (BUSCARH), MATCH (COINCIDIR), INDEX (INDICE).
- 3.3 Fechas y horas: NOW (AHORA), TODAY (HOY); WEEKDAY (DIASEM), WORKDAY (DIA.LAB).
- 3.4 Análisis de datos: Consolidar; Buscar objetivo y Administrador de escenarios; previsiones con AND (Y), IF (SI) y NPER; cálculos financieros con PMT (PAGO); FILTER (FILTRAR); SORTBY (ORDENARPOR).
- 3.5 Solucionar problemas en fórmulas: rastrear precedentes y dependientes; Ventana Inspección; reglas de comprobación de errores; Evaluar fórmula.
- 3.6 Macros sencillas: grabar, nombrar y editar.

**4. Administrar gráficos y tablas avanzados (25–30 %)**
- 4.1 Gráficos avanzados: de doble eje; cajas y bigotes, combinado, embudo, histograma, proyección solar y cascada.
- 4.2 Tablas dinámicas: crear; modificar campos y opciones; segmentaciones de datos; agrupar; campos calculados; configuración de campo de valor.
- 4.3 Gráficos dinámicos: crear; modificar opciones; aplicar estilos; profundizar en los detalles (drill down).

### 1.5 MO-220 (contabilidad) y MO-230 (finanzas): objetivos resumidos

**MO-220 Excel for Accounting.** Temario oficial [VERIFICADO: https://arch-center.azureedge.net/Credentials/exam-mo-220-mos-excel-for-accounting-associate.pdf]. Versión en español de PUE: «Examen MO-220» [VERIFICADO: https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-365-excel-accounting-associate/es]. Requiere «unas 150 horas de formación y experiencia práctica con Excel y contabilidad».
- *Preparar datos contables para el análisis:* importar y exportar (varias fuentes y formatos); limpiar (quitar duplicados, eliminar u ocultar filas, columnas y celdas, dar un formato coherente); verificar la integridad (validación de datos, detectar valores fuera de lo esperado); transformar (dividir una columna, funciones de texto y de fecha, relleno de series).
- *Preparar un balance de comprobación (sumas y saldos):* ordenar y filtrar transacciones; funciones matemáticas y estadísticas, lógicas y de búsqueda.
- *Preparar y analizar estados financieros:* agregar datos con fórmulas; dar formato para presentar; ratios de rentabilidad, liquidez y solvencia; detectar anomalías con formato condicional; auditar fórmulas; **tablas dinámicas, paneles de control y gráficos; accesibilidad y usabilidad**.
- *Tareas contables rutinarias:* tablas de amortización (cuota fija); **conciliación bancaria** (partidas pendientes, formato condicional, saldo ajustado); **cuentas a cobrar y a pagar** (informes de antigüedad, deudores dudosos); **nómina** (bruto, neto, cargas del empleador, irregularidades); **amortización de activos** (cuota periódica y proyección).

**MO-230 Excel for Business Finance** [VERIFICADO: página de Microsoft y PDF de PUE]: preparar datos financieros (los mismos bloques que el MO-220, más proteger libros, hojas y celdas); análisis financiero (análisis horizontal y vertical, desviaciones entre presupuesto y real, ratios, valor del dinero en el tiempo, errores en fórmulas); préstamos e inversiones (funciones financieras, cuadro de amortización, escenarios, precio y rendimiento de bonos, valoración de acciones); previsiones (datos históricos, **Hoja de previsión**, tasas de crecimiento, intereses, análisis de hipótesis, presupuesto de tesorería); paneles de control y gráficos (corregir errores, accesibilidad).

**Uso en la guía:** sus bloques son un **guion casi literal para los casos prácticos de los niveles 4 a 6**: conciliación, antigüedad de saldos, nómina simplificada, amortizaciones, presupuesto frente a real y previsión de tesorería. Hay que adaptarlos a España: IVA, IRPF y Seguridad Social los aporta otra línea de investigación [NO VERIFICABLE: no enseñarlo como dato].

### 1.6 Lo que MOS no cubre y la empresa de 2026 sí usa

Comparación entre los objetivos de 2022 y las competencias que se ven en ofertas y marcos de 2025-2026:

| Tema | ¿Está en MOS? | Por qué la guía debe incluirlo |
|---|---|---|
| **Power Query** (Obtener y transformar: combinar, anexar, anular dinamización, actualizar) | Solo «importar desde texto o en línea» | Aparece en ofertas de analista y controller (Manpower, Helphone, Michael Page) y en el ICAEW 2026, que la cita entre las competencias «General» de las tareas administrativas [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework/administrative] |
| **Power Pivot / modelo de datos / DAX** | No | FUNDAE tiene una especialidad formativa, IFCT153 «Análisis de datos con Excel: Power Query, Power Pivot y Power BI» (60 h), que incluye Power Pivot y DAX pero no se dedica solo a ellos [CORREGIDO: https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/turismo-2023/especialidades-formativas/IFCT153.pdf]; es la base de los cuadros de mando y del paso a Power BI |
| **LAMBDA**, funciones de matriz modernas (APILARV, TOMAR, ELEGIRCOLS, DIVIDIRTEXTO, AGRUPARPOR, PIVOTARPOR…) | No (solo LET) | El ICAEW 2026 actualiza la sección de cálculo con «dynamic arrays and LAMBDA» [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework]. Los nombres en español AGRUPARPOR (GROUPBY) y PIVOTARPOR (PIVOTBY) son los oficiales, igual que APILARV, TOMAR, ELEGIRCOLS y DIVIDIRTEXTO [VERIFICADO: https://support.microsoft.com/es-es/excel/functions/groupby-function y https://support.microsoft.com/es-es/excel/functions/pivotby-function] |
| **Colaboración en la nube** (coautoría, Autoguardado, historial de versiones, @menciones) | Parcial («administrar versiones», comentarios) | ICAEW 2026: «cloud features (version history, AutoSave)» [VERIFICADO] |
| **IA en Excel (Copilot)** | No | ICAEW 2026 añade **6 competencias sobre uso seguro y eficaz de la IA** [VERIFICADO]. **La función `=COPILOT()` dejó de estar disponible el 14/09/2026** (MC1454373). Era una versión preliminar, solo para los programas Frontier y Microsoft 365 Insider, y la ayuda con IA queda en el panel de Copilot. **No hay que enseñar esa función.** [VERIFICADO: https://support.microsoft.com/es-es/excel/functions/copilot-function] |
| **Office Scripts / Python en Excel** | No | ICAEW 2026 los incluye en automatización («Office Scripts and Python») [VERIFICADO]. Para esta alumna basta con conocerlos |
| **Diseño, documentación y control de hojas** (entradas, cálculos y salidas; comprobaciones; revisión) | Muy poco («inspeccionar», «auditar fórmulas») | Es lo que distingue a quien construye hojas de quien solo las usa (ICAEW «Creator»), y Panko muestra que lo habitual es que haya errores |
| **Configuración regional** (CSV con `;`, coma decimal, fechas DD/MM, codificación UTF-8 o ANSI al importar) | No | Es un problema diario en España con las exportaciones de ERP y bancos [NO VERIFICABLE: no enseñarlo como dato] |

### 1.7 Recomendación sobre certificarse

- **Para una alumna en España:** tiene sentido presentarse al MO-210 al terminar el nivel 2 y al MO-211 al terminar el nivel 4. Están en español (el MO-211 con la contradicción de idioma indicada en 1.1). Sirven como prueba externa para el CV, pero **no sustituyen a un portafolio de proyectos**: las ofertas casi nunca piden MOS y sí piden pruebas prácticas.
- **MO-220 y MO-230** solo si su inglés es suficiente y se orienta a contabilidad o finanzas.
- **PL-300** como salida si se orienta a análisis de datos (se renueva cada año).

---

## 2. Qué piden las ofertas de empleo en España

### 2.1 Método y límites

- **No he encontrado ningún estudio público y cuantitativo** que mida qué funciones o herramientas de Excel piden las ofertas en España, ni de InfoJobs, ni de Adecco o Infoempleo, ni de Randstad. El informe Infoempleo Adecco de diciembre de 2025 trata de IA y transformación digital, no de Excel [VERIFICADO: https://www.adeccogroup.com/-/media/project/adecco-group/adeccogroup/spain-content/2025-press-releases/2025-12-02-ndp-informe-infoempleo-adecco-ia-transformacion-digital.pdf]. Se han citado cifras como «el 92 % de las ofertas administrativas piden Office avanzado» (atribuida al Informe Infoempleo-Adecco 2025) o «el 78 % de las empresas…» (atribuida a InfoJobs 2025), pero **solo aparecen en webs de academias y no las he encontrado en la fuente original** [NO VERIFICABLE: no enseñarlo como dato].
- InfoJobs e Indeed **bloquean la lectura automática** (HTTP 456 y 403). LinkedIn no se ha consultado.
- Muestra propia, leída el 14/11/2026: páginas de resultados de Jooble y Jobtoday, ofertas individuales de Adecco, Jobitur y Michael Page, el informe LHH (Grupo Adecco) y extractos de buscador de Randstad, Michael Page, Hays e InfoJobs. **No es representativa**: solo sirve para ver patrones.

### 2.2 Volumen (fotos de buscador, orientativo)

- Jooble España, 14/11/2026: «excel avanzado», **7.898 resultados**; «administrativo excel avanzado», **14.537** [VERIFICADO: https://es.jooble.org/trabajo-excel-avanzado y https://es.jooble.org/trabajo-administrativo-excel-avanzado]. Son cifras infladas porque el agregador duplica ofertas y empareja palabras sueltas.
- InfoJobs, según extractos de buscador sin fecha: «nivel avanzado excel» 910; «excel alto» 1.009; «excel profesional» 2.281; «conocimientos avanzados excel» 89; «nivel avanzado excel conocimientos power bi» 59; «powerbi» 115; «excel» en Administración de empresas 1.695 [NO VERIFICABLE: no enseñarlo como dato].
- Dato histórico de InfoJobs (julio de 2013): en la categoría **Administración de empresas**, el conocimiento más pedido era **Microsoft Excel (n.º 1)**, por delante de Microsoft Office, Contabilidad y SAP R/3 Financials. En Comercial y ventas, Excel era el n.º 5. [VERIFICADO: https://orientacion-laboral.infojobs.net/conocimientos-experiencia/]. Es antiguo, pero es el único ranking de InfoJobs publicado.
- Internacional: Course Report analizó más de 12 millones de ofertas tecnológicas de Indeed en EE. UU. (datos de 2025, informe actualizado el 27/06/2025) y encontró Excel en **531.000**, frente a 67.000 de Python y 60.000 de SQL [VERIFICADO: https://www.coursereport.com/reports/trending-tech-skills-certifications-report].

### 2.3 Muestra de ofertas con el requisito de Excel copiado literalmente

| # | Puesto / empresa o ETT / lugar | Requisito de Excel (literal o resumido) | Otro software | Fuente |
|---|---|---|---|---|
| 1 | Administrativo/a con Excel alto · Carballo (Jobitur, nov. 2026) | Nivel avanzado: **BUSCARV, tablas dinámicas, macros**, gráficos; informes periódicos, conciliaciones, control de cobros y pagos | — | [VERIFICADO: https://www.jobitur.com/trabajo/administrativo-con-excel-alto-contrato-fijo-discontinuo-en-carballo/] |
| 2 | Administrativo/a de almacén con Excel alto · San Fernando de Henares (Adecco) | «Dominio avanzado de Excel (**tablas dinámicas, fórmulas, filtros, gráficos**, etc.)»; 11,52 €/h; ESO o Bachillerato | «el sistema de la empresa» | [VERIFICADO: https://www.adecco.com/es-es/ofertas-trabajo/administrativoa-de-almacn-con-excel-alto-40h-san-fernando-de-henares-san-fernando-de-henares-madrid/08d9b463ef5b9ae60936336454f47e8f] |
| 3 | Junior Financial Reporting & Controlling Analyst · Madrid (Michael Page, 15/09/2026, 30–35 k€) | «Advanced Excel skills» (sin más detalle) | SAP (valorable), Hyperion (muy valorable); inglés C1 | [VERIFICADO: https://www.michaelpage.es/job-detail/financial-controller-reporting-analyst/ref/jn-092026-7099995] |
| 4 | Administrativo/a de facturación · Barcelona (Eurofirms) | «Conocimientos EXCEL (**fórmulas, tablas dinámicas**, etc)» | — | [VERIFICADO: listado de https://jobtoday.com/es/trabajo/estamos-buscando-un-administrativo-a-con-excel-avanzado-9wGnlg, nov. 2026] |
| 5 | Administrativo/a RRHH CAE · L'Hospitalet (Merchanservis) | «Buen manejo de Excel, especialmente **tablas dinámicas y cruces de datos**» | Plataformas CAE | [VERIFICADO: mismo listado] |
| 6 | Recepcionista administrativo/a · Barcelona (Ehureka) | «Buen dominio de Excel, Word y correo electrónico» | — | [VERIFICADO: mismo listado] |
| 7 | Auxiliar administrativo/a · Barcelona | «Manejo de Excel u otras hojas de cálculo» | — | [VERIFICADO: mismo listado] |
| 8 | Reclutamiento y selección junior · Barcelona (Merchanservis) | Excel **básico-intermedio** | — | [VERIFICADO: mismo listado] |
| 9 | Analista de Operaciones O2C · Barcelona (Temps) | «Valorable conocimiento de SAP y Excel» | SAP | [VERIFICADO: mismo listado] |
| 10 | Analista Administrativo/a – Excel Avanzado · Cheste (Lidl) | «dominio avanzado de Excel y perfil analítico» | — | [VERIFICADO: https://es.jooble.org/trabajo-excel-avanzado] |
| 11 | Técnico/a administrativo/a de control operativo · Barcelona (Zurich) | «Uso avanzado de Excel y del paquete Office 365» | — | [VERIFICADO: https://es.jooble.org/trabajo-administrativo-excel-avanzado] |
| 12 | Administrativo de Formación y RRHH · Madrid (PwC) | «la elaboración de informes en Excel» | — | [VERIFICADO: ídem] |
| 13 | Técnico en Licitaciones y Ofertas · Pozuelo (Manpower) | «Excel avanzado y nivel alto de inglés» | — | [VERIFICADO: https://es.jooble.org/trabajo-excel-avanzado] |
| 14 | Contable sénior · A Rúa, Ourense | «ERP y Excel avanzado» | ERP | [VERIFICADO: ídem] |
| 15 | Gestor/a de servicios · Barcelona (Acciona) | «experiencia en cuentas de resultados y Excel avanzado» | — | [VERIFICADO: ídem] |
| 16 | Administrativo de compras · Las Rozas | «herramientas avanzadas de Excel, como **tablas dinámicas**» | — | [VERIFICADO: ídem] |
| 17 | Automation-Driven Controller: Power BI & Finance · Madrid (Continental) | «strong Excel and **Power BI** skills» | Power BI | [VERIFICADO: https://es.jooble.org/trabajo-power-query] |
| 18 | Controller financiero (perfil tipo, informe LHH «Los + Buscados 2025») | «Dominio de herramientas **ERP y Excel avanzado**»; 45.000–65.000 € | ERP | [VERIFICADO: https://www.adeccogroup.com/-/media/project/adecco-group/adeccogroup/spain-content/2025-press-releases/2025-01-28-informe-mas-buscados-lhh-recruitment-solutions-2025.pdf] |
| 19 | Analista de Datos Junior y Soporte Funcional · Madrid, remoto (Manpower, jul.–ago. 2026) | Avanzado (**tablas dinámicas, fórmulas complejas**), **Power Query**; **macros/VBA muy valorables**, no obligatorias; Power BI | Power BI | [NO VERIFICABLE: no enseñarlo como dato] |
| 20 | Analista de datos SAP, logística · Madrid (Helphone) | «Excel avanzado, **Power Query**, o herramientas de extracción SAP como SE16/SQVI» | SAP | [NO VERIFICABLE: no enseñarlo como dato] |
| 21 | Analista de Datos Junior · Madrid (XTART) | «Nivel avanzado de Excel (tablas dinámicas, fórmulas complejas…)» y SQL | SQL | [NO VERIFICABLE: no enseñarlo como dato] |
| 22 | Técnico/a Jr IT – Excel avanzado / Power BI · Madrid (Baoss) | Tablas dinámicas y fórmulas complejas; **macros valorables** | Power BI | [NO VERIFICABLE: no enseñarlo como dato] |
| 23 | Finance Transformation Analyst (Michael Page) | «Strong Excel skills. **Power Query, Power BI** or data mapping experience is a plus» | — | [NO VERIFICABLE: no enseñarlo como dato] |
| 24 | Finance Business Partner Southern Europe (Retail) · Madrid (Michael Page) | «Advanced Excel skills» | SAP FI&CO; SAP BW, Tableau, Anaplan | [VERIFICADO: https://www.michaelpage.es/job-detail/finance-business-partner-southern-europe-retail/ref/jn-042026-7003059] (caducada, 410) |
| 25 | Controller de Gestión y Analítica de Datos Junior (Hays, vía Jooble) | Informes y visualizaciones con Power BI y Excel; «Dominio de Excel y conocimientos de Power BI» | Power BI | [CORREGIDO: https://es.jooble.org/jdp/2950707478632446205] |
| 26 | Auxiliar administrativo/a · Valencia (Randstad) | «manejo avanzado de excel (tablas dinámicas, fórmulas, informes)»; solo FP Básica | — | [NO VERIFICABLE: no enseñarlo como dato] |
| 27 | Técnico de aprovisionamiento · Marcilla (Randstad) | «Buen manejo del paquete Excel: análisis, fórmulas, tablas dinámicas» | Business Central | [NO VERIFICABLE: no enseñarlo como dato] |
| 28 | Secretario/a administrativo/a · Oviedo (Randstad) | «Excel avanzado, Word avanzado» | Contaplus / Navision | [NO VERIFICABLE: no enseñarlo como dato] |
| 29 | Administrativo/a con Excel avanzado · Alcobendas (InfoJobs) | Nivel AVANZADO (tablas dinámicas, gráficos, funciones); 2 años de experiencia | — | [NO VERIFICABLE: no enseñarlo como dato] |
| 30 | Administrativo/a · El Prat (Jobtoday, extracto) | BUSCARV e **INDICE+COINCIDIR**, tablas dinámicas; **prueba técnica** | — | [NO VERIFICABLE: no enseñarlo como dato] |

**Recuento aproximado sobre las 30 ofertas** (cualitativo, no estadístico):
- Dicen «Excel avanzado/alto» sin concretar: **la mayoría**. En la página de Jooble «excel avanzado», 19 de 20 lo mencionan y solo 1 concreta algo.
- Cuando se concreta: **tablas dinámicas, unas 12**; fórmulas o «fórmulas complejas», unas 9; **búsquedas** (BUSCARV, INDICE+COINCIDIR, «cruces de datos»), 4; gráficos e informes, unos 6; filtros, 2.
- **Macros:** 5, casi siempre «valorable». **Power Query:** 4 (analista y finanzas). **Power BI:** 6 (analista y controller).
- **ERP o software de gestión al lado de Excel:** unas 10 (SAP, Hyperion, Business Central, Navision, Contaplus).
- **Prueba práctica anunciada:** 1 o 2 explícitas. Muchas ETT dicen en su texto general que «en algunos casos» la hay.

### 2.4 Qué quiere decir cada etiqueta de nivel en las ofertas (interpretación justificada)

| Etiqueta en la oferta | Qué se espera en la práctica | Puestos típicos | Nivel de la guía |
|---|---|---|---|
| «Excel a nivel usuario», «manejo de Excel», «ofimática a nivel usuario», «Excel u otras hojas de cálculo» | Abrir, rellenar y mantener una hoja; formato; sumas y promedios; ordenar y filtrar; imprimir. Puede que «nivel usuario» venga de la antigua tabla de autoevaluación de competencias digitales de Europass (2015), cuyos niveles eran «usuario básico / usuario independiente / usuario competente» [VERIFICADO: https://documents.uji.es/alfresco/d/d/workspace/SpacesStore/48750491-4276-4ae3-85f3-06904719af16/Competencias+dixitais+UE.pdf?guest=true]; ese origen es una hipótesis, no un dato | Recepción, auxiliar, comercial, atención al cliente, almacén | **N1** |
| «Excel intermedio», «buen manejo de Excel», «básico-intermedio» | Tablas, SI, SUMAR.SI, CONTAR.SI, BUSCARV o BUSCARX sencillo, formato condicional, gráficos | Administración general, RRHH junior, compras, logística | **N2** |
| «Excel avanzado», «Excel alto», «dominio de Excel» (administración, compras, logística, RRHH, facturación) | **Tablas dinámicas, cruces de datos (BUSCARV/BUSCARX, INDICE+COINCIDIR), fórmulas condicionales con varios criterios, filtros, gráficos e informes periódicos**, limpieza de exportaciones del ERP. Macros «valorables» | Administrativo/a con Excel avanzado, facturación, conciliaciones, control de stock, RRHH CAE | **N3** |
| «Excel avanzado» en analista, controller o FP&A, a menudo en inglés («advanced/strong Excel») | Lo anterior más **Power Query**, modelos (presupuesto, previsión, desviaciones), escenarios, **Power BI**, a veces macros o VBA y SQL; trabajo con datos de SAP | Analista de datos junior, controller, reporting, business partner | **N4–N5** |
| «Excel experto», «nivel muy alto» | Igual que la fila anterior y además **diseñar y mantener herramientas que usan otros** (modelos, plantillas, automatizaciones); VBA si el puesto lo pide | Controller sénior, analista FP&A, técnico de procesos | **N5–N6** |

**Conclusión para el temario:** el nivel 3 de la guía tiene que dejarla **preparada para aprobar la prueba de un puesto administrativo con «Excel avanzado»**: tabla dinámica más búsquedas más SUMAR.SI.CONJUNTO, con datos sucios y en 45 minutos. Es el umbral de empleo más frecuente en la muestra. Además, cada nivel debe practicar **con datos que parezcan exportaciones de ERP o de banco** (CSV con `;`, fechas como texto, espacios, duplicados, códigos con ceros a la izquierda).

### 2.5 Datos internacionales (contraste, sin verificar)

- Jobsolv (blog de una web de empleo de EE. UU., artículo del 20/03/2026, actualizado el 19/07/2026) dice que las ofertas de analista de marketing mencionan tablas dinámicas en el 67 %, BUSCARV o INDICE-COINCIDIR en el 54 % y visualización o gráficos en el 48 %, sin decir la muestra ni el método; las 12.842 ofertas que cita el mismo artículo son para otras cifras (89 %, 78 %, 71 %) [CORREGIDO: https://jobsolv.com/blog/excel-for-marketing-analytics].
- ITJobsWatch (Reino Unido, seis meses hasta el 14/11/2026): de las ofertas fijas que citan PowerPivot, el 100 % citan también Power Query, pero son solo 4 ofertas [CORREGIDO: https://www.itjobswatch.co.uk/jobs/uk/powerpivot.do]; la cifra antigua (92,86 % hasta mayo de 2025) ya no se puede comprobar. Con una muestra tan pequeña no sirve como dato.
- TestGorilla (proveedor de tests, sus propios datos) dice, hablando de «85 años» de investigación, que las pruebas de muestra de trabajo predicen el rendimiento mejor (0,54) que las entrevistas no estructuradas (0,38). Esas cifras son de Schmidt y Hunter (1998), no de Schmidt y Oh, y la revisión posterior de Schmidt, Oh y Shaffer (2016) las cambia: muestras de trabajo 0,33 y entrevistas no estructuradas 0,58, lo mismo que las estructuradas [CORREGIDO: https://doi.org/10.1037/0033-2909.124.2.262 ; tabla comparativa 1998/2016 en https://www.testpartnership.com/blog/measure-quality-hire.html]. Por eso esta cifra no sirve como argumento. Que la guía evalúe con tareas reales se apoya mejor en que las pruebas de selección reales son prácticas (apartado 3.1).

---

## 3. Cómo son las pruebas de Excel en los procesos de selección

### 3.1 Tipos de prueba

| Tipo | Duración | Formato | Qué evalúa | Fuente |
|---|---|---|---|---|
| **TestGorilla «Microsoft Excel (General)»** | 12 min | Preguntas prácticas y teóricas, opción múltiple; nivel «intermedio» (la propia web también lo llama «de entrada») | Conceptos básicos de la hoja, tablas, gestión de datos, fórmulas y funciones (cita BUSCARV y SUMAR.SI) | [VERIFICADO: https://www.testgorilla.com/test-library/software-skills-tests/microsoft-excel-general-test/] |
| **TestGorilla «Microsoft Excel (Advanced)»** | 10 min | Opción múltiple; **existe en español** | Formato condicional, fórmulas y referencias avanzadas, **Power Query**, gráficos, grandes volúmenes de datos, automatización, integración | [VERIFICADO: https://testgorilla.com/test-library/role-specific-skills-tests/microsoft-excel-advanced-test]. Catálogo en español: [VERIFICADO: https://www.testgorilla.com/es/catalogo-de-pruebas/habilidades-especificas-del-rol/prueba-de-microsoft-excel-avanzado/] |
| **Criteria «Microsoft Excel 365»** | 5–7 min | 12 preguntas adaptativas de opción múltiple; la versión «Interactive» añade 3 simulaciones | Fórmulas y funciones, formato, ordenar y filtrar, gráficos, **macros y VBA, tablas dinámicas, validación**. Informe de Beginner a Advanced | [VERIFICADO: https://criteriacorp.helpdocs.io/article/dy5pk4asss-microsoft-excel-365] |
| **SHL «Microsoft Excel 365 (New)»** | unos 35 min | Simulación | Crear y analizar datos, presentar datos de forma visual, compartir, mantener y proteger libros | [NO VERIFICABLE: no enseñarlo como dato] |
| **SHL Excel 365 Essentials** | 25 min permitidos, unos 15 de media | Simulación, hasta 20 preguntas | Ordenar y filtrar, funciones y fórmulas simples, formato | [NO VERIFICABLE: no enseñarlo como dato] |
| **IBM Kenexa Prove It! Excel** (Normal User / Power User) | Variable | Simulación de Excel, unas 25–30 tareas | Básico, intermedio y avanzado según el nivel; parece que IBM lo está retirando | [NO VERIFICABLE: no enseñarlo como dato] |
| **Prueba práctica propia de empresa o ETT** | 30–60 min | Archivo con datos e instrucciones | Limpiar datos; BUSCARV o BUSCARX; SI; SUMAR.SI.CONJUNTO o CONTAR.SI.CONJUNTO; **tabla dinámica desde la base de datos dada**; gráfico; formato condicional; **dejar la tabla ordenada, sin errores y fácil de entender** | [NO VERIFICABLE: no enseñarlo como dato] |
| **Caso o modelo para finanzas** (FP&A, controller, banca) | 60–90 min, a veces hasta 3 h o para casa | Modelo desde cero o completar uno | Búsquedas, sumas con condiciones, **PAGO, VNA, TIR**, **tablas de datos para sensibilidad**, escenarios, cuadres; previsión a 5 años con comprobación de balance en menos de 90 min | [NO VERIFICABLE: no enseñarlo como dato] |
| **Oposiciones, supuesto práctico** (Ayto. de Madrid, auxiliar administrativo) | **30 min** | Reproducir dos hojas modelo | Fuente y formato, combinar y centrar, bordes, **formato personalizado**, encabezado y pie, **referencias mixtas o absolutas**, SI anidado, búsqueda, MIN, PROMEDIO, CONTAR.SI, € e impuestos, **gráfico con tamaño exacto (7×12 cm)** | [VERIFICADO: https://www.madrid.es/UnidadWeb/Contenidos/Oposiciones/AuxAdtvo2020/ficheros/cexcel.pdf] |
| **Oposiciones, test** (Ayto. de Soto del Real, 2025) | **45 min** | **40 preguntas con 3 opciones**, Word y Excel | Pestañas, atajos, valores por defecto, iconos | [VERIFICADO: https://www.ayto-sotodelreal.es/wp-content/uploads/2025/04/PLANTILLA-SEGUNDO-EJERCICIO-PROCESO-SELECCION-AUXILIAR-ADMINISTRATIVO-TURNO-LIBRE-Y-CUPO-DISCAPACIDAD.pdf] |
| **MOS** (referencia) | 50 min | Varios proyectos en Excel real; enunciados sin nombre de función | Los objetivos de los apartados 1.3 y 1.4 | [VERIFICADO] |

### 3.2 Tareas típicas por nivel en una prueba práctica (síntesis)

- **«Intermedio» (equivale a N2):** a partir de una tabla de 50 a 100 filas, poner formato de moneda y %, calcular con referencias absolutas (IVA, total), SI para clasificar, SUMAR.SI o CONTAR.SI por categoría, un gráfico de columnas, ordenar y filtrar [NO VERIFICABLE: no enseñarlo como dato].
- **«Avanzado» de administración (equivale a N3):** cruzar dos listados (BUSCARX o BUSCARV con coincidencia exacta y control de #N/D), totales con varios criterios, **tabla dinámica** por mes y comercial con porcentajes, **segmentación**, gráfico dinámico, quitar duplicados y separar columnas, **formato condicional** de alertas. En la tabla dinámica se suele pedir una columna nueva o un acumulado [NO VERIFICABLE: no enseñarlo como dato].
- **Analista o finanzas (equivale a N4–N5):** Power Query para unir varios archivos, desviación entre presupuesto y real, escenarios, cuadro de amortización, sensibilidad, panel con KPI [NO VERIFICABLE: no enseñarlo como dato].
- **Diagnóstico de errores:** encontrar por qué una búsqueda da #N/D (espacios, número guardado como texto) o por qué una tabla dinámica no se actualiza [VERIFICADO: TestGorilla pone como ejemplo de tarea «BUSCARV da #N/D a ratos» y «la tabla dinámica no se actualiza con datos nuevos», https://www.testgorilla.com/blog/assess-excel-proficiency/ ; causas de #N/D en BUSCARV (tipos de datos distintos, espacio adicional en las celdas): https://support.microsoft.com/es-es/office/corregir-un-error-n-a-a9708411-f82e-4e1b-8a7e-28c28311b993 ; actualizar la tabla dinámica con Analizar tabla dinámica > Datos > Actualizar o Alt+F5: https://support.microsoft.com/es-es/office/actualizar-los-datos-de-tabla-din%C3%A1mica-6d24cece-a038-468a-8176-8b6568ca9be2].

### 3.3 Consecuencias para el diseño del examen final de la guía

1. **Tres partes:**
   - (a) **Test** de unas 30 preguntas en unos 30 minutos, con explicación, sobre conceptos, atajos y elección de función, siguiendo el estilo de TestGorilla, Criteria y las oposiciones.
   - (b) **Práctica en la hoja en vivo** de 30 a 45 minutos, con datos sucios y enunciados **tipo MOS**, corregida por resultado.
   - (c) **Proyecto .xlsx** con rúbrica, en Excel real: tabla dinámica, Power Query, gráfico y protección.
2. Repartir el peso de la parte (b) **siguiendo los pesos MOS** del nivel que se evalúa. Para el examen final, la mezcla sería: datos y formato 30 %, fórmulas 30 %, tablas dinámicas y gráficos 25 %, libro y colaboración 15 %.
3. **Puntuar la claridad**, no solo la exactitud: encabezados, sin valores fijos dentro de las fórmulas, sin errores visibles, comprobaciones de cuadre. Es lo que valoran las pruebas reales y el marco ICAEW.
4. Poner **tiempo límite** en las prácticas desde el nivel 2, porque todas las pruebas reales lo tienen.

---

## 4. Marcos de niveles que usan instituciones, formadores y empresas

### 4.1 DigComp 3.0 (Comisión Europea, JRC, 11/2025)

- 5 áreas y 21 competencias; **4 niveles de dominio: Básico, Intermedio, Avanzado y Muy avanzado**. Se pueden hacer equivaler a los 8 niveles de DigComp 2.2. Hay 362 enunciados de competencia. [VERIFICADO: PDF oficial alojado por OeAD, https://digitalekompetenzen.oead.at/fileadmin/Dokumente/oead.at/Bildung_Digital/Digitale_Kompetenzen/NRDK/2025_DigComp_3.0_European_Digital_Competence_Framework.pdf; JRC: https://publications.jrc.ec.europa.eu/repository/handle/JRC144705]
- Descripción de cada nivel (tabla 3):
  - **Básico:** recuerda y realiza tareas sencillas «con guía si hace falta».
  - **Intermedio:** realiza tareas bien definidas y resuelve problemas bien definidos «de forma autónoma».
  - **Avanzado:** valora y aplica soluciones a tareas complejas y variadas de forma autónoma y se adapta al contexto, **guiando a otros si hace falta**.
  - **Muy avanzado:** resuelve problemas muy complejos o especializados, crea soluciones nuevas y lidera.
- Enunciados sobre hojas de cálculo (competencia 1.3, gestión de la información):
  - Básico: CS1.3.04 «Organizar y dar formato a datos simples… como en hojas de cálculo».
  - Intermedio: CS1.3.11 «Organizar y dar formato a datos **y aplicar fórmulas básicas**… como en hojas de cálculo».
  - Avanzado: CS1.3.16 «Aplicar el análisis adecuado… para contribuir a decisiones complejas».
  - Muy avanzado: CS1.3.19 «Desarrollar e implantar estrategias para la gestión, el procesamiento y el análisis de datos complejos o especializados». [VERIFICADO]
- **Uso en la guía:** DigComp es demasiado general para Excel, pero da el **criterio de autonomía**, que sirve para el nivel 6: pasar de «con guía» a «de forma autónoma» y después a «guía a otros».

### 4.2 ICAEW Spreadsheet Competency Framework, 2.ª edición (02/07/2026)

- Primera edición del 05/07/2016; **segunda, actualizada el 02/07/2026**; **82 competencias** en 4 niveles. Novedades: nube (historial de versiones, Autoguardado), cálculo (**matrices dinámicas, LAMBDA**), automatización (**Office Scripts, Python**) y **6 competencias nuevas sobre uso seguro y eficaz de la IA**. [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework]
- Niveles, cada uno entendido como **mínimo** para un puesto:
  - **Basic user:** usa la hoja con seguridad, introduce datos de forma fiable y se mueve por el libro.
  - **General user:** usa muchas funciones, fórmulas, manipulación de datos e informes en situaciones sencillas.
  - **Creator:** construye hojas para su organización, explica cálculos de varias capas y conecta con otros sistemas para intercambiar datos.
  - **Developer:** aporta conocimientos externos a la hoja de cálculo (programación, estándares de modelado, grandes volúmenes de datos) para ampliar lo que se puede hacer.
  - Recomendación literal: todos los que acceden a las hojas de una organización, al menos Basic; **quien las diseña, al menos Creator**. [VERIFICADO]
- El marco evita a propósito las etiquetas «intermedio» y «avanzado» y prefiere describir **el tipo de trabajo** [SIN VERIFICAR: extracto del artículo de ICAEW].
- Perfiles de puesto (9): audit preparer, audit reviewer, educación (2), financial modeller, financial modeller (audit), industry accountants, **administrative** y **operations**.
  - **Administrative:** «dominio sólido de todas las competencias del nivel Basic», más control de versiones y **uso seguro de la IA para preguntar a sus datos**. Le resultan útiles muchas del nivel General, como el controlador de relleno o **importar con Power Query**. [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework/administrative]
  - **Operations:** casi todo Basic y General y **muchos necesitan Creator**, porque trabajan a diario con grandes volúmenes de datos; Developer es útil, con tablas dinámicas y automatización. [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework/operations]
  - **Industry accountants:** lo esencial es un **diseño robusto, las buenas prácticas, la revisión y la protección frente a errores**. [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework/industry-accountants]
  - Artículo de agosto de 2026 (Bani Lamba, 19/08/2026), con ejemplos: el nivel General incluye formato, fórmulas y funciones y análisis de datos; Creator incluye gráficos y visualización y **revisión de hojas**; se citan tablas dinámicas, Power Query, INDICE/COINCIDIR y BUSCARX, VBA y Office Scripts, protección y mensajes de error, comprobación de errores y controles. [VERIFICADO: https://www.icaew.com/technical/technology/excel-community/excel-community-articles/2026/a-refreshed--look-at-defining-spreadsheet-competency]
- No hay una lista descargable de las 82 competencias: la página de ICAEW dice que están «outlined in detail in the Framework» y las muestra en un resumen interactivo incrustado en la propia página y en un panel de Power BI aparte, que se filtra por sección, puesto, nivel y relevancia. Cada página de perfil de puesto recoge las competencias de ese puesto. Ninguno de los dos interactivos se ha podido leer [CORREGIDO: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework].

### 4.3 ICDL «Spreadsheets (advanced)», temario 3.1

Categorías [VERIFICADO: https://icdl.org/wp-content/uploads/ICDL-Spreadsheets-advanced-Syllabus-3.1.pdf]:
1. **Formato:** formato condicional, formatos personalizados, texto en columnas, plantillas.
2. **Fórmulas y funciones:** fecha (HOY, AHORA, DIA, MES, AÑO, DIAS.LAB), lógicas (Y, O, NO), matemáticas, estadísticas (CONTAR.SI, CONTAR.BLANCO, JERARQUIA), texto (ESPACIOS…), financieras (VF, VA, PAGO, VNA.NO.PER, SLN, DB), búsqueda (BUSCARV, BUSCARH, **BUSCARX**, INDICE, COINCIDIR), bases de datos (BDSUMA…), anidadas de 2 niveles, referencias 3D, referencias mixtas.
3. **Gráficos:** combinados, minigráficos, eje secundario, escalas.
4. **Análisis:** tablas dinámicas (crear, actualizar, filtrar, agrupar), **tablas de datos de una y dos variables**, ordenaciones personalizadas, filtro avanzado, esquemas, **escenarios**.
5. **Validación y auditoría:** validación con mensajes, rodear datos no válidos, rastrear precedentes, mostrar fórmulas, comentarios.
6. **Productividad:** nombres, modo grupo, pegado especial, vínculos, importar texto delimitado, **macros y scripts** (grabar, ejecutar, asignar a un botón).
7. **Edición colaborativa:** comparar y combinar libros, proteger, ocultar fórmulas, compartir.

### 4.4 España: formación oficial para el empleo

- **UF0321 «Aplicaciones informáticas de hojas de cálculo», 50 h**, dentro del módulo MF0233_2 Ofimática (190 h), que es transversal a varios certificados de Administración y gestión. Capacidad C1: «Utilizar hojas de cálculo con habilidad… tabulación y tratamiento aritmético-lógico y/o estadístico… presentación en gráficos». Contenidos: formato, fórmulas con referencias relativas, absolutas y mixtas y **externas y vínculos**, resolución de errores, funciones, gráficos, impresión, **validación, esquemas, tablas o listas, ordenar, filtros, subtotales**, comentarios, control de cambios, protección, «libros compartidos», importación, **plantillas y macros (grabadora)**. [VERIFICADO: https://web.lanbide.eus/descargas/egailancas/certificados/UF/ADGD0208.MF0233_2.UF0321.pdf]. **Está desfasada:** no menciona tablas dinámicas por su nombre (solo «gráficos dinámicos»), ni BUSCARX, ni Power Query. Equivale más o menos a los niveles 1 y 2 de la guía, con algo del 4.
- **Especialidades FUNDAE/SEPE** (catálogo de formación para el empleo):
  - **ADGG020PO** «Excel avanzado», 20 h; no es «básico-intermedio» ni dura 40 h [CORREGIDO: https://www.aprendemas.com/es/curso/curso-subvencionado-de-excel-avanzado-adgg020po-1187716/ ; la ficha oficial de FUNDAE no se pudo abrir].
  - **ADGG021PO** «Fundamentos Excel», no «Excel avanzado», 20 h [CORREGIDO: https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/especialidades-formativas/ADGG021PO.pdf (el título sale en el índice del buscador; el PDF devolvió 503) y https://www.adams.es/catalogo/scorm/adgg021po-fundamentos-excel/].
  - **ADGG20** «MS Excel 2016 avanzado (accesible)», 25 h, presencial o teleformación, ficha de diciembre de 2022 [VERIFICADO: https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/planes_2025/especialidades/ADGG20.pdf].
  - **IFCT153** «Análisis de datos con Excel: Power Query, Power Pivot y Power BI», **60 h**, teleformación, mayo de 2022 [VERIFICADO: https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/convocatoria-programas-2021/especialidades-formativas/IFCT153.pdf].
  - Su valor es que **la propia administración separa «Excel avanzado» (20 h) de «análisis de datos con Power Query, Power Pivot y Power BI» (60 h)**. Es la misma separación que la de los niveles 3–4 y 5 de la guía.
- **ACTIC (Generalitat de Catalunya):** acreditación oficial de competencias digitales (Decreto 13/2021) con tres niveles: básico, medio y avanzado. Desde la Orden EMT/47/2026 sus contenidos se organizan en cinco áreas competenciales (búsqueda, gestión y análisis de la información; comunicación y colaboración; creación de contenidos, programación y fabricación digital; seguridad, bienestar y civismo digital; autonomía y resolución de problemas), y ya no hay una competencia propia de hoja de cálculo [CORREGIDO: https://tramits.gencat.cat/ca/tramits/tramits-temes/Proves-dacreditacio-de-competencies-en-tecnologies-de-la-informacio-i-la-comunicacio-ACTIC]. Lo que entraba de hoja de cálculo en el nivel medio del modelo anterior (rangos, ordenación, filtros, gráficos, «la hoja de cálculo como base de datos») sale solo de materiales de cursos [NO VERIFICABLE: no enseñarlo como dato].

### 4.5 Formadores y plataformas privadas

- **TestGorilla:**
  - Básico: entrada de datos, formato, SUMA y PROMEDIO, gráficos básicos.
  - Intermedio: **BUSCARV, INDICE-COINCIDIR, ordenar y filtrar, tablas dinámicas, formato condicional**.
  - Avanzado: fórmulas complejas y depuración, **macros y VBA, modelado, Power Query y Power Pivot**. [VERIFICADO: https://testgorilla.com/blog/what-are-levels-excel-proficiency]
  - **Ojo:** TestGorilla pone las tablas dinámicas en «intermedio», mientras que las ofertas españolas las llaman «avanzado». **Las etiquetas no coinciden entre países ni entre proveedores.**
- **Wall Street Prep, Excel Crash Course** (finanzas), orden del temario: navegación y atajos; formato (paneles, pegado especial, nombres, referencias, auditoría, Ir a Especial, formato condicional, formatos personalizados, TEXTO, errores, impresión); fechas y concatenación (SI, SI.CONJUNTO, SI.ERROR, FIN.MES, FECHA.MES, FRAC.AÑO); **búsquedas y tablas de datos** (BUSCARV, BUSCARH, INDICE, COINCIDIR, ELEGIR, DESREF, INDIRECTO, desplegables, tablas de datos, BUSCARX); matemáticas (SUMAPRODUCTO, condicionales, redondeo, VA, VF, VNA, VNA.NO.PER, TIR, TIR.NO.PER); texto (Relleno rápido, Texto en columnas, quitar duplicados); ordenar, filtrar y tablas dinámicas; resolver problemas; **LAMBDA**; apéndice de macros y VBA. [VERIFICADO: https://www.wallstreetprep.com/self-study-programs/excel-crash-course/]
- **CFI, «Excel Skills for Professionals»**, unas 11–12 h según su web (sus cinco cursos suman 13 h): fundamentos, fórmulas para finanzas, preparación de datos y visualización, cuadros de mando. Cada curso lleva una etiqueta de nivel: en esta especialización van del «Level 1» al «Level 3»; su curso aparte «Advanced Excel Formulas & Functions» es «Level 3» (4 h 30 min) [CORREGIDO: https://corporatefinanceinstitute.com/specializations/excel-skills-for-professionals · https://corporatefinanceinstitute.com/course/advanced-excel-formulas-and-functions/].
- **Macquarie University, «Excel Skills for Business»** (Coursera), **unas 107 h** en 4 cursos:
  - Essentials (26 h): interfaz, fórmulas, formato, gráficos.
  - Intermediate I (28 h): grandes volúmenes de datos, informes, cuadros de mando, automatización.
  - Intermediate II (28 h): prevención de errores, macros, validación, modelado, lógica condicional, previsión.
  - Advanced (25 h): búsquedas avanzadas, limpieza, funciones financieras y de fecha, cuadros de mando interactivos. [VERIFICADO: https://www.coursera.org/specializations/excel]

### 4.6 Tabla de consenso: qué pone cada marco en cada tramo

| Tramo | DigComp 3.0 | ICAEW 2026 | MOS | ICDL | España (oficial) | Ofertas en España |
|---|---|---|---|---|---|---|
| Entrar y rellenar | Básico | Basic | — | Spreadsheets (core) | UF0321, primera parte | «nivel usuario» |
| Fórmulas básicas, formato, gráficos, tablas | Intermedio | Basic→General | MO-210 | Core | UF0321 | «intermedio» |
| Tablas dinámicas, búsquedas, condicionales, limpieza | Intermedio→Avanzado | General | MO-211 (parte) | Advanced 3.1 | ADGG021PO | **«avanzado/alto»** |
| Análisis de hipótesis, macros, protección, auditoría, Power Query | Avanzado | General→Creator | MO-211 | Advanced 3.1 | ADGG021PO + IFCT153 | analista, «Power Query valorable» |
| Modelo de datos, DAX, cuadros de mando, automatización | Avanzado | Creator (+Developer) | MO-220/230 (orientados al puesto) | — | IFCT153 | controller y analista con Power BI |
| Diseña, valida, documenta y mantiene herramientas para otros | Avanzado→Muy avanzado | **Creator (mínimo para diseñar)** | — | — | — | «experto», autonomía |

---

## 5. Propuesta: mapa de 7 niveles (0 a 6)

### 5.1 Por qué 7 niveles

- **N0** es necesario porque la alumna parte de cero (puede no saber qué es una celda). Ningún marco profesional empieza ahí y DigComp exige requisitos previos incluso para su nivel Básico.
- Del **N1 al N4** cada nivel coincide con una **etiqueta que el mercado reconoce** («nivel usuario», «intermedio»/MO-210, «avanzado» en las ofertas, MO-211/experto). Así la alumna sabe qué poner en el CV en cada momento.
- **N5** separa el análisis y la automatización (Power Pivot, DAX, cuadros de mando, macros), igual que FUNDAE separa el Excel avanzado (ADGG021PO) del análisis con Power Query, Power Pivot y Power BI (IFCT153).
- **N6** no añade herramientas: añade **método y autonomía** (requisitos, diseño, control, entrega y mantenimiento). Es el nivel Creator de ICAEW y el «autónomo y guía a otros» de DigComp.
- Cada nivel termina con un **entregable de portafolio** y una **prueba de salida con tiempo**, parecida a las pruebas reales.

Horas orientativas: la referencia es MOS (unas 150 h por certificación) y Macquarie (unas 107 h). Total **del N0 al N6: entre 250 y 350 h**. Reparto: N0 8 h · N1 25 h · N2 40 h · N3 45 h · N4 55 h · N5 60 h · N6 50 h, más la práctica en el puesto [propuesta propia].

Convenciones para todos los niveles: funciones en español; `;` como separador; `,` como decimal; fechas DD/MM/AAAA; €; **datos de empresas españolas ficticias** (IVA 21 %, provincias, NIF ficticios). **En todos los niveles se practica comprobar, no solo construir.**

---

### N0 · Primeros pasos («qué es una celda»)

**Perfil de salida:** abre, rellena y guarda una hoja que otra persona ha preparado, sin romperla.

**Es capaz de…** (competencias observables)
- Nombrar y señalar: libro, hoja, pestaña, fila (número), columna (letra), **celda y su dirección (C5)**, rango (A1:C10), cinta de opciones, barra de fórmulas, cuadro de nombres y barra de estado (suma y promedio de la selección).
- Crear, guardar (.xlsx) con un nombre con sentido en una carpeta o en OneDrive, cerrar y volver a abrir. Distinguir «Guardar» de «Guardar como».
- Moverse con ratón y teclado: flechas, Tab, Intro, **Ctrl+Inicio, Ctrl+flecha**, Ctrl+Avpág/Repág para cambiar de hoja.
- Escribir texto, números con **coma decimal**, fechas **DD/MM/AAAA** y porcentajes. Saber reconocer por la alineación si Excel lo ha tomado como número o como texto.
- Editar (F2 o doble clic), borrar (Supr), **deshacer y rehacer (Ctrl+Z / Ctrl+Y)**, copiar, cortar y pegar (Ctrl+C/X/V).
- Seleccionar celdas, rangos, filas y columnas enteras; ajustar el ancho de columna con doble clic.
- Escribir una **fórmula que empieza por `=`** con + − * / ^ y referencias (=B2*C2). Entender que se recalcula al cambiar un dato. Usar **Autosuma**.
- Cambiar el nombre de una hoja y añadir o eliminar hojas.
- Exportar a PDF o imprimir con la vista previa.

**Tareas de empresa que puede hacer sola:** rellenar una plantilla existente (parte de horas, hoja de pedidos, registro de visitas); sumar una columna de importes; enviar un PDF.

**Prueba de salida (hoja en vivo, unos 15 min):** 8 microtareas (escribir, corregir, fórmula con referencias, Autosuma, renombrar hoja) más un test de vocabulario de 10 preguntas.

**Errores que hay que detectar y enseñar:** escribir el importe y el símbolo € a mano en la celda; usar el punto como decimal (Excel lo interpreta como texto o como fecha); escribir números en la fórmula en lugar de referencias (=100*21 en vez de =B2*C2); no guardar.

**Equivalencias:** DigComp Básico (CS1.3.04); camino hacia ICAEW Basic.

---

### N1 · Usuaria básica («Excel a nivel usuario»)

**Perfil de salida:** prepara hojas sencillas y presentables con cálculos correctos y las imprime o comparte.

**Es capaz de…**
- Aplicar **formatos de número**: moneda €, contabilidad, %, fecha corta y larga, separador de miles, decimales. Además, bordes, relleno, fuente, alineación, ajustar texto, combinar y centrar (y saber cuándo no conviene), **estilos de celda** y **Copiar formato**.
- Insertar y eliminar filas, columnas y celdas; ocultar y mostrar; mover y copiar hojas.
- **Rellenar series** (números, fechas, meses, días) con el controlador de relleno y copiar fórmulas hacia abajo.
- Distinguir **referencia relativa y absoluta** ($B$1, tecla F4), por ejemplo para el tipo de IVA en una celda fija.
- Usar **SUMA, PROMEDIO, MAX, MIN, CONTAR, CONTARA, CONTAR.BLANCO, REDONDEAR, HOY**, y **SI** sencillo (=SI(C2>=1000;"Grande";"Normal")).
- Ordenar (A→Z, mayor a menor) y aplicar **autofiltro** (texto, número, fecha).
- **Inmovilizar paneles** (fila de encabezado).
- Configurar la página: orientación, márgenes, **ajustar a una página**, área de impresión, **imprimir títulos**, encabezado y pie con número de página. Exportar a PDF.
- Crear un **gráfico de columnas, líneas o circular** con título y etiquetas.
- Añadir **notas y comentarios**; buscar y reemplazar.
- Guardar como **PDF y CSV** y saber qué se pierde en un CSV (formato, fórmulas, hojas).

**Tareas de empresa que puede hacer sola:** factura o presupuesto sencillo (base, IVA 21 %, total); listado de gastos del mes con totales; cuadrante de vacaciones; listado de clientes filtrable; informe impreso a una página con encabezado de empresa.

**Prueba de salida (unos 25 min):** a partir de un listado de 40 líneas de pedido: formato, IVA con referencia absoluta, totales, SI para marcar pedidos grandes, filtro de un cliente, gráfico por mes y PDF a una página.

**Errores que hay que detectar y enseñar:** olvidar el $ al copiar la fórmula del IVA; combinar celdas dentro de una lista de datos (estropea ordenar y filtrar); totales escritos a mano; confundir formato (lo que se ve) con valor (lo que hay).

**Equivalencias:** ofertas «nivel usuario» o «manejo de Excel»; ICAEW Basic; aproximadamente el 50–60 % del MO-210 (dominios 1, 2 y 5 en lo básico); núcleo de la UF0321; DigComp Intermedio (CS1.3.11, fórmulas básicas).

---

### N2 · Usuaria intermedia (≈ MO-210)

**Perfil de salida:** organiza datos en tablas, los cruza y los resume con funciones condicionales, y prepara libros limpios para compartir.

**Es capaz de…**
- Convertir un rango en **Tabla de Excel** (Ctrl+T): estilo, **fila de totales**, columnas calculadas y **referencias estructuradas** (=[@Cantidad]*[@Precio]); entender por qué las tablas crecen solas.
- **Ordenar por varios niveles** y filtrar por color, por condición y por los 10 primeros.
- **Nombres definidos** (TipoIVA) y usarlos en fórmulas; ir a ellos desde el cuadro de nombres.
- **Formato condicional integrado** (resaltar reglas, barras de datos, escalas de color, conjuntos de iconos) y quitarlo; **minigráficos**.
- **Pegado especial**: valores, formatos, transponer y operaciones (multiplicar por 1,05).
- Funciones de **texto**: IZQUIERDA, DERECHA, EXTRAE, LARGO, MAYUSC, MINUSC, NOMPROPIO, **ESPACIOS**, CONCAT, **UNIRCADENAS** y &.
- **SI anidado y con Y/O**; **SUMAR.SI, CONTAR.SI, PROMEDIO.SI**.
- **BUSCARX** (coincidencia exacta y valor si no se encuentra) y **BUSCARV** con coincidencia exacta (FALSO); entender el error #N/D.
- **Fechas**: DIA, MES, AÑO, FECHA, DIAS y restar fechas; formato de fecha frente a número de serie.
- Matrices dinámicas básicas: **ORDENAR, UNICOS, SECUENCIA, ALEATORIO.ENTRE**; entender el **desbordamiento** y el error #¡DESBORDAMIENTO!.
- **Importar un CSV o TXT** (Datos > Desde texto/CSV) eligiendo el delimitador `;` y la configuración regional, sin que las fechas ni los ceros a la izquierda se estropeen.
- **Validación de datos** con lista desplegable y mensaje de error; protección sencilla de hoja.
- **Inspeccionar documento** (datos personales, comentarios ocultos) y **Comprobar accesibilidad**; texto alternativo en gráficos.
- Vistas (Normal, Diseño de página, Salto de página), hipervínculos, grupos de hojas, propiedades del libro, **mostrar fórmulas** (Ctrl+`).
- Modificar gráficos: añadir series, cambiar filas por columnas, elementos, diseños y estilos; crear una hoja de gráfico.

**Tareas de empresa que puede hacer sola:** registro de entradas o incidencias como Tabla con desplegables; limpiar una lista de clientes recibida en CSV (nombres, espacios, duplicados visibles); informe mensual de ventas por comercial con SUMAR.SI; cruzar el listado de pedidos con la tarifa usando BUSCARX; plantilla de factura con búsqueda del precio.

**Prueba de salida (unos 35 min, tipo MOS, enunciados sin nombre de función):** 3 miniproyectos (registro, informe, gráfico) con unas 15 tareas.

**Errores que hay que detectar y enseñar:** BUSCARV sin FALSO (coincidencia aproximada sin querer); números guardados como texto que no suman; filas vacías dentro de los datos; fechas importadas como texto (mes y día cambiados).

**Equivalencias:** **MO-210 completo** (presentarse aquí es opcional); ofertas «Excel intermedio» o «buen manejo»; ICAEW Basic sólido más parte de General (perfil Administrative); TestGorilla General (12 min).

---

### N3 · Análisis de datos con Excel (el «Excel avanzado» de las ofertas)

**Perfil de salida:** convierte una exportación sucia en un informe fiable con tablas dinámicas y fórmulas con varios criterios, y aprueba la prueba práctica de un puesto administrativo con «Excel avanzado».

**Es capaz de…**
- **Sumar y contar con varios criterios**: SUMAR.SI.CONJUNTO, CONTAR.SI.CONJUNTO, PROMEDIO.SI.CONJUNTO, MAX.SI.CONJUNTO, MIN.SI.CONJUNTO, con criterios de fecha (">="&FECHA(…)) y comodines.
- Lógica: **SI.CONJUNTO, CAMBIAR, SI.ERROR, SI.ND**, ESBLANCO, ESNUMERO.
- Búsquedas: **BUSCARX** con coincidencia aproximada (tramos de comisión o de descuento) y búsqueda inversa o del último valor, **INDICE+COINCIDIR** (y COINCIDIRX), BUSCARV con COINCIDIR para la columna; saber cuándo usar cada una.
- Matrices dinámicas: **FILTRAR** (con varios criterios * y +), **ORDENARPOR**, combinaciones con UNICOS (listados por cliente, rankings).
- **Tablas dinámicas**: crearlas a partir de una Tabla; filas, columnas, valores y filtros; **configuración de campo de valor** (suma, recuento, promedio, % del total, % de la fila, diferencia respecto a…); **agrupar fechas** por mes, trimestre y año, y números por intervalos; ordenar; **segmentaciones y escala de tiempo**; **actualizar** y cambiar el origen; **campo calculado**; diseño en forma tabular; **gráfico dinámico** con profundización en el detalle.
- Gráficos: **combinado con eje secundario** (ventas en € y margen en %); elegir el gráfico según el mensaje.
- Limpieza: **Quitar duplicados, Texto en columnas, Relleno rápido**, SUSTITUIR, TEXTO, VALOR, ESPACIOS; convertir texto en número o en fecha.
- **Subtotales y esquemas** (agrupar y desagrupar).
- **Formato condicional con fórmula** (fila entera si está vencido; =$F2<HOY()); administrar reglas.
- **Validación dependiente** (desplegable de provincia que depende de la comunidad) y con fórmula.
- Fechas laborales: **DIA.LAB, DIAS.LAB** (con festivos), DIASEM, FIN.MES, FECHA.MES; antigüedad en días.
- **Auditoría**: rastrear precedentes y dependientes, **Ventana Inspección**, **Evaluar fórmula**, comprobación de errores. Interpretar #N/D, #¡VALOR!, #¡REF!, #¡DIV/0!, #¿NOMBRE?, #¡DESBORDAMIENTO! y #¡NUM!.

**Tareas de empresa que puede hacer sola:** informe mensual de ventas (tabla dinámica, segmentaciones, % sobre el total, comparación entre meses); **conciliación** de dos listados (banco frente a contabilidad, pedidos frente a facturas: qué falta en cada lado); **antigüedad de saldos** de clientes (0–30, 31–60, 61–90, más de 90 días); control de stock con alertas de mínimo; cálculo de **comisiones por tramos**; informe de absentismo o de horas de RRHH; limpieza y resumen de una exportación de A3, Sage, SAP o Business Central.

**Prueba de salida (45 min, archivo con unas 500 filas sucias):** limpiar, cruzar con un maestro, totales con varios criterios, tabla dinámica con segmentación, gráfico combinado, formato condicional de alertas y una hoja de «Resumen» legible. Es el **formato de la prueba técnica de ETT o empresa** (apartado 3.2).

**Errores que hay que detectar y enseñar:** tabla dinámica sin actualizar tras cambiar los datos; rango de origen fijo que deja fuera las filas nuevas (por eso hay que usar Tablas); duplicados al cruzar por campos que no son únicos; criterios de fecha escritos como texto; medias de porcentajes en lugar de porcentajes de totales.

**Equivalencias:** ofertas «Excel avanzado/alto» de administración, compras, logística, RRHH y facturación; aproximadamente el 70 % del MO-211 (dominios 2, 3.1–3.3, 3.5 y 4); ICAEW General; ICDL Advanced (análisis, búsquedas, validación y auditoría).

---

### N4 · Experta (≈ MO-211 + Power Query)

**Perfil de salida:** automatiza el informe repetitivo, hace simulaciones y escenarios y entrega plantillas protegidas que otras personas rellenan sin romperlas.

**Es capaz de…**
- **Power Query** (Datos > Obtener y transformar):
  - Importar desde CSV, Excel, **carpeta** (combinar los archivos de todos los meses) y web.
  - Definir tipos y **configuración regional es-ES**; dividir, quitar y rellenar; **anular la dinamización** (pasar una tabla de meses en columnas a filas); **combinar consultas** (equivalente a un BUSCARX entre tablas) y **anexar**.
  - Cargar a una Tabla o al modelo; **actualizar con un clic**; entender que el paso aplicado sustituye a repetir el trabajo a mano.
- **LET** para fórmulas legibles; **formatos personalizados** (#.##0,00 €;[Rojo]-#.##0,00 €; 0" días"; "T"0); validación avanzada.
- **Proteger** la hoja y los rangos (desbloquear solo las celdas de entrada), proteger la estructura del libro, restringir la edición, ocultar fórmulas.
- **Opciones de cálculo** (automático o manual, F9); **referencias a otros libros** y gestión de vínculos (actualizar, cambiar origen, romper); **historial de versiones** en OneDrive o SharePoint.
- **Consolidar** varios rangos u hojas.
- Análisis de hipótesis: **Buscar objetivo**, **Administrador de escenarios** (informe de resumen) y **Tablas de datos** de una y dos variables.
- Finanzas: **PAGO, NPER, TASA, VA, VF**; **cuadro de amortización** de un préstamo (sistema francés), con interés y capital separados.
- Gráficos avanzados: **cascada** (resultado), **histograma**, **cajas y bigotes**, **embudo**, **proyección solar**, **combinado de doble eje**.
- **Macros grabadas**: guardar en .xlsm, habilitar contenido y su seguridad, **nombrar, ejecutar, asignar a un botón, editar lo básico en VBA** (cambiar un rango o un texto) y copiar módulos entre libros.
- **Plantillas** (.xltx) y Relleno de serie avanzado; MATRIZALEAT para generar datos de prueba.

**Tareas de empresa que puede hacer sola:** informe mensual **automatizado** (carpeta, Power Query, tabla dinámica y actualizar); **consolidar** los ficheros de varias delegaciones; **cuadro de amortización** y comparativa de préstamos; simulador de precios o márgenes con escenarios; **plantilla corporativa protegida** (solicitudes, gastos de viaje) con validaciones; macro que aplica el formato y exporta a PDF.

**Prueba de salida (50 min, tipo MO-211) más un minicaso .xlsx:** Power Query de 3 CSV con distinta estructura, escenarios, amortización, plantilla protegida y un gráfico de cascada.

**Errores que hay que detectar y enseñar:** Power Query con configuración regional errónea (fechas o decimales); vínculos externos rotos; proteger sin desbloquear antes las celdas de entrada; macros guardadas en .xlsx (se pierden); Buscar objetivo sobre una celda que tiene un valor fijo en lugar de una fórmula.

**Equivalencias:** **MO-211 completo** (momento recomendado para examinarse); ICAEW General→Creator; ofertas de analista con «Power Query valorable»; ICDL Advanced completo; FUNDAE ADGG021PO más parte de IFCT153; TestGorilla Advanced.

---

### N5 · Modelado, automatización y cuadros de mando

**Perfil de salida:** construye modelos de datos con varias tablas, cuadros de mando de KPI para dirección y automatizaciones sencillas, y usa la IA para trabajar más rápido sin dejar de verificar.

**Es capaz de…**
- **Modelo de datos y Power Pivot**: tabla de hechos y tablas de dimensiones (clientes, productos, calendario); **relaciones** (esquema en estrella); **medidas DAX básicas** (SUMA, CALCULATE con filtro, DIVIDE, comparación con el año anterior usando una tabla calendario); tabla dinámica desde el modelo con segmentaciones conectadas.
- Matrices modernas: **APILARV, APILARH, ELEGIRCOLS, TOMAR, EXCLUIR, DIVIDIRTEXTO, TEXTOANTES y TEXTODESPUES** (Excel 2024 y Microsoft 365), y **AGRUPARPOR y PIVOTARPOR** (solo Microsoft 365) [VERIFICADO: https://support.microsoft.com/es-es/office/funciones-de-excel-por-orden-alfab%C3%A9tico-b3944572-255d-4efb-bb96-c6d90033e188]; **LAMBDA** con nombre (función propia reutilizable, por ejemplo IVA_INCLUIDO).
- **Cuadro de mando**: definir 4–6 **KPI** con quien lo pide; estructura con datos, cálculos y presentación; gráficos limpios (sin 3D, ejes honestos, etiquetas directas); segmentaciones que controlan varias tablas dinámicas; **accesibilidad** (contraste, texto alternativo, no depender solo del color); preparado para imprimir o compartir.
- **Modelos de presupuesto o previsión**: separar **entradas, cálculos y salidas**; supuestos documentados; **comprobaciones** (los totales cuadran, sin errores); sensibilidad; **Hoja de previsión** (PRONOSTICO.ETS) con sentido crítico.
- **Automatización**: macros VBA sencillas editadas a mano (bucle por las hojas, exportar PDF por cliente) **o** Office Scripts (pestaña **Automatizar**), que funcionan en Excel para la web, en Excel para Windows (versión 2210 o posterior) y en Excel para Mac, pero solo con una licencia de empresa o educación de Microsoft 365 (Empresa, Empresa Premium, E1, E3, E5, A3, A5, F3…) y OneDrive para la Empresa; en Microsoft 365 Personal y Familia están solo en versión preliminar, y no vienen en Excel 2021 o 2024 de pago único; saber cuándo conviene Power Query y cuándo una macro [CORREGIDO: https://learn.microsoft.com/es-es/office/dev/scripts/testing/platform-limits].
- **IA en Excel (Copilot, en el panel)**: pedir fórmulas o explicaciones, revisar y **verificar** con casos de prueba; no meter datos personales o confidenciales en herramientas no autorizadas; explicar lo que hace cada fórmula que genere la IA (corresponde a las competencias de IA del ICAEW 2026). **No usar =COPILOT()**, ya retirada.
- Conocer **Python en Excel** y Power BI: qué son y cuándo dar el salto. No es obligatorio dominarlos.

**Tareas de empresa que puede hacer sola:** **cuadro de mando comercial** mensual (ventas, margen, n.º de clientes, ticket medio, comparación con el año anterior, top 10) a partir de 3 fuentes relacionadas; **control presupuestario** por departamento (presupuesto frente a real, desviación en € y %, semáforos); previsión de tesorería a 12 meses con escenarios; automatización del envío o la exportación semanal.

**Prueba de salida:** proyecto .xlsx de cuadro de mando con modelo de datos (unas 6 h de trabajo, con rúbrica) y defensa oral breve (explicar cada KPI y cómo se actualiza).

**Errores que hay que detectar y enseñar:** relaciones de varios a varios o sin tabla calendario; medidas frente a columnas calculadas; cuadros de mando con demasiados gráficos; fórmulas de IA aceptadas sin probarlas; macros que sobrescriben datos sin copia de seguridad.

**Equivalencias:** ICAEW Creator (con algo de Developer); ofertas de analista o controller con Power BI y Power Query; FUNDAE IFCT153; temas del MO-220 y el MO-230 (paneles, previsión, presupuesto frente a real); puente al PL-300.

---

### N6 · Autonomía en proyectos completos

**Perfil de salida:** recibe un encargo de negocio y lo lleva sola de principio a fin (entender, diseñar, construir, comprobar, entregar y mantener) con un resultado fiable que otras personas pueden usar y que se mantiene sin ella.

**Es capaz de…**
1. **Recibir el encargo y convertirlo en requisitos.** Pregunta para quién es, qué decisión se va a tomar, con qué frecuencia, de qué fuentes salen los datos y quién es su responsable, el plazo, el formato de entrega, quién lo mantendrá y qué es confidencial. Lo deja por escrito en una hoja «Léame» o en un correo de una página, y **calcula el tiempo que llevará**.
2. **Entender los datos (perfilado).** Comprueba volumen, campos, tipos, claves únicas, vacíos, duplicados, valores atípicos y periodos que faltan. Documenta los problemas y **pregunta antes de suponer**.
3. **Diseñar.**
   - Elige la herramienta adecuada: fórmulas, Tabla, tabla dinámica, Power Query o modelo de datos.
   - Separa **entradas, datos, cálculos, salidas y controles** en hojas distintas.
   - Usa nombres claros, colores convencionales (entradas en un color, fórmulas en otro), sin valores fijos dentro de las fórmulas y con una sola fórmula por columna.
   - Prevé que el volumen crezca y que llegue el mes siguiente.
4. **Construir** con las herramientas de los niveles 1 a 5, **de forma incremental** y guardando versiones.
5. **Comprobar**: totales de control frente a la fuente («el total del informe = el total del ERP»), **celdas de control** que avisan si algo no cuadra, casos límite (mes sin ventas, cliente nuevo, devolución negativa), revisión con Rastrear y Evaluar fórmula, **revisión por otra persona** o autorrevisión con una lista de comprobación, Inspeccionar documento y Comprobar accesibilidad.
6. **Entregar**: resumen en lenguaje de negocio (3 conclusiones y lo que hay que vigilar); PDF o enlace con los **permisos adecuados**; protección; versión final con nombre y fecha.
7. **Mantener y traspasar**: **manual breve** de cómo actualizarlo (pasos o botón de «Actualizar todo»), **registro de cambios**, responsable, qué hacer si cambia el formato de la fuente; que otra persona pueda mantenerlo.
8. **Cuidar el riesgo y el cumplimiento**: datos personales (RGPD, art. 5.1.c, «minimización de datos»: solo los datos necesarios para el fin; por eso, no compartir de más y quitar las columnas sensibles antes de enviar) [VERIFICADO: https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807]; vínculos y macros; copias de seguridad; uso responsable de la IA (ICAEW 2026).
9. **Comunicar y negociar el alcance**: decir lo que no se puede hacer con los datos disponibles; proponer alternativas; avisar con tiempo de los retrasos.

**Proyectos de empresa que puede hacer sola** (ejemplos para los proyectos finales de la guía):
- Cuadro de mando de ventas mensual **automatizado** a partir de las exportaciones del ERP.
- **Control presupuestario** anual por departamentos con desviaciones y comentarios.
- **Conciliación bancaria** mensual con partidas pendientes.
- **Gestión de inventario**: stock, rotación, punto de pedido y alertas.
- **Informe de RRHH**: plantilla, altas y bajas, absentismo, horas extra, con datos anonimizados.
- **Herramienta de presupuestos u ofertas para comerciales**: plantilla protegida con tarifa, descuentos por tramos y PDF.

**Prueba de salida (proyecto final con rúbrica):** encargo realista (un correo del «jefe» con datos adjuntos sucios); de 8 a 12 horas de trabajo; entrega del libro, una nota de entrega y el manual de mantenimiento; después, un **cambio inesperado** (llega un mes nuevo con una columna más) para probar si se mantiene.

**Rúbrica propuesta** (cada criterio de 0 a 4, peso entre paréntesis):

| Criterio | 0 | 2 | 4 |
|---|---|---|---|
| Requisitos (15 %) | No pregunta; hace otra cosa | Cubre lo principal, con supuestos sin decir | Requisitos escritos, supuestos explícitos, alcance acordado |
| Exactitud (20 %) | Resultados erróneos | Correctos con errores menores | Cuadran con la fuente; controles en verde |
| Robustez y mantenimiento (15 %) | Se rompe con datos nuevos | Aguanta con ajustes manuales | Se actualiza sola con datos nuevos; no hay valores fijos |
| Diseño y claridad (15 %) | Caótico | Entendible con explicación | Entradas, cálculos y salidas separados; nombres; Léame |
| Herramientas adecuadas (10 %) | Todo a mano | Funciona, pero de forma poco eficiente | La herramienta justa (Power Query, tabla dinámica, fórmulas) |
| Comunicación (10 %) | Sin conclusiones | Datos sin interpretar | 3 conclusiones de negocio y riesgos |
| Documentación y traspaso (10 %) | Ninguna | Notas parciales | Manual, registro de cambios, responsable |
| Seguridad y cumplimiento (5 %) | Datos sensibles expuestos | Protección parcial | Permisos, protección, datos minimizados |

**Equivalencias:** ICAEW **Creator** (el mínimo que recomienda para quien diseña hojas); DigComp Avanzado→Muy avanzado («de forma autónoma… guiando a otros»); ofertas de «Excel experto»; la alumna puede presentarse al MO-211 y, si sabe inglés, al MO-220 o MO-230, y como salida al PL-300.

---

### 5.2 Cobertura de los objetivos MOS en el mapa (para comprobar que no falta nada)

| Objetivo MOS | Nivel de la guía |
|---|---|
| MO-210 · 1.1 importar texto y web | N2 (texto/CSV); N4 (Power Query) |
| MO-210 · 1.2 navegación, nombres, hipervínculos | N0 a N2 |
| MO-210 · 1.3–1.4 página, vistas, inmovilizar, propiedades, mostrar fórmulas, barra de acceso rápido | N1–N2 |
| MO-210 · 1.5 área de impresión, exportar, inspeccionar, comentarios y notas | N1–N2 |
| MO-210 · 2.1 pegado especial, autorrelleno, insertar y eliminar, ALEATORIO.ENTRE, SECUENCIA | N1–N2 |
| MO-210 · 2.2 formatos, estilos de celda, agrupar hojas | N1–N2 |
| MO-210 · 2.3 nombres | N2 |
| MO-210 · 2.4 minigráficos y formato condicional integrado | N2 |
| MO-210 · 3 tablas | N2 |
| MO-210 · 4 referencias, funciones básicas, SI, ORDENAR, UNICOS, texto | N1–N2 |
| MO-210 · 5 gráficos y texto alternativo | N1–N2 |
| MO-211 · 1.1 macros entre libros, vínculos, habilitar macros, versiones | N4 |
| MO-211 · 1.2 proteger, restringir, opciones de cálculo | N4 |
| MO-211 · 2.1 Relleno rápido, Rellenar serie, MATRIZALEAT | N3 (Relleno rápido); N4 |
| MO-211 · 2.2 formatos personalizados, validación, esquemas, subtotales, duplicados | N3–N4 |
| MO-211 · 2.3 formato condicional avanzado | N3 |
| MO-211 · 3.1 lógica anidada y funciones .CONJUNTO, LET | N3 (LET en N4) |
| MO-211 · 3.2 búsquedas | N2 (BUSCARX y BUSCARV básicos); N3 |
| MO-211 · 3.3 fechas | N2–N3 |
| MO-211 · 3.4 Consolidar, Buscar objetivo, escenarios, NPER, PAGO, FILTRAR, ORDENARPOR | N3 (FILTRAR, ORDENARPOR); N4 |
| MO-211 · 3.5 auditoría | N3 |
| MO-211 · 3.6 macros | N4 (N5 VBA) |
| MO-211 · 4.1 gráficos avanzados | N3 (combinado); N4 |
| MO-211 · 4.2–4.3 tablas y gráficos dinámicos | N3 |
| MO-220/230 · conciliación, antigüedad, amortizaciones, nómina, ratios, presupuesto frente a real, previsión | Casos de N3–N6 |

### 5.3 Qué se practica en la hoja en vivo (HyperFormula) y qué en el .xlsx

- **Hoja en vivo de la web (fórmulas en español):** N0–N3 en lo que se refiere a fórmulas (operadores, referencias, SUMA… SI, SUMAR.SI.CONJUNTO, BUSCARV, INDICE/COINCIDIR, fechas, texto). **Comprobado en HyperFormula 3.5.0 con el idioma esES:** funcionan con su nombre de Excel BUSCARX, ORDENAR, UNICOS, SECUENCIA, SI.CONJUNTO, MAX.SI.CONJUNTO, DIA.LAB y UNIRCADENAS; **FILTRAR no** (en esES se llama FILTER, sin traducir), **CAMBIAR no** (solo acepta SWITCH) y **LET no existe**. Los resultados en matriz se desbordan a las celdas de al lado, y si una está ocupada sale #¡DESBORDAMIENTO!. Ojo: VERDADERO y FALSO hay que escribirlos con paréntesis, VERDADERO() y FALSO(), o la hoja da #¿NOMBRE? (Excel los acepta sin paréntesis) [CORREGIDO: https://www.npmjs.com/package/hyperformula/v/3.5.0].
- **Solo en Excel real (.xlsx descargables):** tablas dinámicas y segmentaciones, Power Query, Power Pivot y DAX, gráficos (todos los tipos), formato condicional, validación, protección, macros (.xlsm), Buscar objetivo, escenarios, tablas de datos, configuración de página e impresión, Inspeccionar documento y Copilot.
- Cada .xlsx debería incluir una hoja **«Comprobación»** con celdas de control (VERDADERO/FALSO), para que la alumna se autocorrija en Excel real sin depender de la web.

### 5.4 Qué poner en el CV en cada nivel (honesto)

- N1: «Excel: nivel usuario (formato, fórmulas básicas, filtros, gráficos, impresión)».
- N2: «Excel intermedio: tablas, SUMAR.SI/CONTAR.SI, BUSCARX, formato condicional». Opcional: MO-210.
- N3: «Excel avanzado: tablas dinámicas, BUSCARX/INDICE-COINCIDIR, SUMAR.SI.CONJUNTO, limpieza de datos y auditoría de fórmulas».
- N4: «Excel avanzado: Power Query, análisis de hipótesis, macros, plantillas protegidas». Opcional: MO-211.
- N5: «Modelos de datos (Power Pivot/DAX), cuadros de mando, automatización».
- N6: el portafolio de proyectos (2 o 3 casos con capturas y una descripción del problema y su impacto).

---

## 6. Alertas (lo que el temario no debe olvidar)

1. **Los objetivos MOS en vigor son de 2022.** Hay que enseñar BUSCARX y matrices dinámicas como base, no como extra, y añadir Power Query, Power Pivot, LAMBDA y Copilot, aunque no se examinen en MOS.
2. **El enlace oficial al temario del MO-210 tiene un nombre de archivo erróneo** («security-operations-analyst-skills-measured.pdf»), pero el contenido es el del MO-210. Si se enlaza en la guía, conviene explicarlo o enlazar la página de la certificación.
3. **Para el MO-211 Microsoft da información de idioma contradictoria**: la página de la certificación incluye el español y la del examen dice «English». Hay que confirmarlo con Certiport o PUE antes de recomendarlo en español.
4. **MO-220 y MO-230 son nuevos y solo están en inglés.** Sirven como guion de casos, pero no como certificación recomendada si la alumna no sabe inglés.
5. **=COPILOT() se retiró el 14/09/2026** (MC1454373). No hay que enseñarla; Copilot se usa desde el panel.
6. **Las traducciones de PUE tienen errores**: falta «Aplicar estilos de celda» y pone «marcos» en lugar de «macros». Hay que usar los PDF oficiales en inglés como referencia.
7. **«Excel avanzado» quiere decir cosas distintas según el puesto y el país.** En administración en España equivale a tablas dinámicas, cruces de datos y fórmulas condicionales; en análisis y finanzas añade Power Query, Power BI y modelos. TestGorilla llama «intermedio» a lo que las ofertas españolas llaman «avanzado».
8. **Las macros y VBA casi nunca son obligatorias** en la muestra («valorable»). No hay que darles más peso que a Power Query, que crece en puestos de analista.
9. **Excel va siempre junto a un ERP.** Hay que practicar con exportaciones realistas (CSV con `;`, codificación, fechas como texto, ceros a la izquierda, espacios) y con la configuración regional es-ES.
10. **Las cifras del tipo «el 92 % de las ofertas administrativas…» (Infoempleo-Adecco) o «el 78 % de las empresas…» (InfoJobs 2025) no se han podido verificar.** No hay que citarlas en la guía.
11. **Todas las pruebas reales tienen tiempo límite** (entre 5 y 12 minutos en los tests y entre 30 y 60 en las prácticas). Hay que entrenar con cronómetro desde el N2 y con **enunciados sin nombre de función** (estilo MOS).
12. **Hay que medir la exactitud y la claridad.** Panko encontró errores en al menos el 86 % de las hojas auditadas con buenos métodos, y el ICAEW pone la revisión y el control de errores en el centro del nivel Creator. Los controles de cuadre deben estar en todos los niveles.
13. **La UF0321 oficial (50 h) está desfasada**: no nombra las tablas dinámicas, ni BUSCARX, ni Power Query, y sigue hablando de «libros compartidos». No conviene usarla como referencia de contenido moderno.
14. **Hay que comprobar el soporte de HyperFormula esES** antes de diseñar ejercicios en vivo con BUSCARX, FILTRAR, UNICOS, LET o desbordamiento. Lo que no funcione se pasa a .xlsx.
15. **N0 es imprescindible**: DigComp da por hecho que se sabe usar el dispositivo y la nube (guardar, carpetas, OneDrive). Si falla eso, la alumna se pierde en el N1.

---

## 7. Fuentes consultadas (14/11/2026)

**Primarias, leídas:**
- Microsoft Learn · MO-210 / Excel Associate: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-associate-m365-apps/
- PDF de objetivos del MO-210 (24/10/2022): https://arch-center.azureedge.net/Learning/Credentials/microsoft-certified-security-operations-analyst-skills-measured.pdf
- Microsoft Learn · examen MO-211: https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-211/
- Microsoft Learn · certificación Excel Expert: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-expert-m365-apps/
- PDF de objetivos del MO-211: https://arch-center.azureedge.net/Learning/Credentials/MO-211_OD_MOS365_ExcelExpert.pdf
- Microsoft Learn · MO-220: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-accounting-associate/ · PDF: https://arch-center.azureedge.net/Credentials/exam-mo-220-mos-excel-for-accounting-associate.pdf
- Microsoft Learn · MO-230: https://learn.microsoft.com/en-us/credentials/certifications/mos-excel-for-business-finance-associate/
- Microsoft Learn · MO-200, MO-201 y PL-300: https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-200/ · …/mo-201/ · …/pl-300/
- Microsoft Learn · duración y formato del examen: https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience
- Microsoft Q&A · ¿el MO-211 basta para el título Expert?: https://learn.microsoft.com/en-us/answers/questions/5738147/is-the-microsoft-office-specialist-excel-expert-ti
- Certiport · blog de retiradas (04/02/2026): https://certiport.pearsonvue.com/Blog/2026/February/Stay-connected-Exam-retirement-updates
- Certiport/PUE · objetivos en español: MO-210 https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-excel-365/es · MO-211 https://pue.es/pue-academy/certiport/examenes/objetivos/mos-excel-expert-365/es · MO-220 https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-365-excel-accounting-associate/es · MO-230 https://www.pue.es/pue-academy/certiport/examenes/objetivos/mos-365-business-finance-associate/es
- Certiport · PDF del MO-210 de 2022 (copia universitaria): https://business.appstate.edu/sites/default/files/mos_365_excel_od_2022.pdf
- DigComp 3.0 (PDF del JRC alojado por OeAD): https://digitalekompetenzen.oead.at/fileadmin/Dokumente/oead.at/Bildung_Digital/Digitale_Kompetenzen/NRDK/2025_DigComp_3.0_European_Digital_Competence_Framework.pdf · Colección del JRC: https://publications.jrc.ec.europa.eu/repository/handle/JRC144705
- ICAEW SCF: https://www.icaew.com/technical/technology/excel-community/spreadsheet-competency-framework · Perfil Administrative: …/administrative · Perfil Operations: …/operations · Perfil Industry accountants: …/industry-accountants · Artículo del 19/08/2026: https://www.icaew.com/technical/technology/excel-community/excel-community-articles/2026/a-refreshed--look-at-defining-spreadsheet-competency
- ICDL Spreadsheets (advanced) 3.1: https://icdl.org/wp-content/uploads/ICDL-Spreadsheets-advanced-Syllabus-3.1.pdf
- Lanbide · UF0321: https://web.lanbide.eus/descargas/egailancas/certificados/UF/ADGD0208.MF0233_2.UF0321.pdf
- Ayuntamiento de Madrid · supuesto de Excel: https://www.madrid.es/UnidadWeb/Contenidos/Oposiciones/AuxAdtvo2020/ficheros/cexcel.pdf
- Ayuntamiento de Soto del Real · test de 2025: https://www.ayto-sotodelreal.es/wp-content/uploads/2025/04/PLANTILLA-SEGUNDO-EJERCICIO-PROCESO-SELECCION-AUXILIAR-ADMINISTRATIVO-TURNO-LIBRE-Y-CUPO-DISCAPACIDAD.pdf
- Grupo Adecco · Informe Infoempleo Adecco (02/12/2025): https://www.adeccogroup.com/-/media/project/adecco-group/adeccogroup/spain-content/2025-press-releases/2025-12-02-ndp-informe-infoempleo-adecco-ia-transformacion-digital.pdf
- LHH · «Los + Buscados 2025»: https://www.adeccogroup.com/-/media/project/adecco-group/adeccogroup/spain-content/2025-press-releases/2025-01-28-informe-mas-buscados-lhh-recruitment-solutions-2025.pdf
- InfoJobs · conocimientos más pedidos (2013): https://orientacion-laboral.infojobs.net/conocimientos-experiencia/
- Ofertas: https://www.jobitur.com/trabajo/administrativo-con-excel-alto-contrato-fijo-discontinuo-en-carballo/ · https://www.adecco.com/es-es/ofertas-trabajo/administrativoa-de-almacn-con-excel-alto-40h-san-fernando-de-henares-san-fernando-de-henares-madrid/08d9b463ef5b9ae60936336454f47e8f · https://www.michaelpage.es/job-detail/financial-controller-reporting-analyst/ref/jn-092026-7099995 · https://jobtoday.com/es/trabajo/estamos-buscando-un-administrativo-a-con-excel-avanzado-9wGnlg · https://es.jooble.org/trabajo-excel-avanzado · https://es.jooble.org/trabajo-administrativo-excel-avanzado · https://es.jooble.org/trabajo-power-query
- TestGorilla: https://www.testgorilla.com/test-library/software-skills-tests/microsoft-excel-general-test/ · https://testgorilla.com/test-library/role-specific-skills-tests/microsoft-excel-advanced-test · https://testgorilla.com/blog/what-are-levels-excel-proficiency · https://www.testgorilla.com/blog/assess-excel-proficiency/
- Criteria · Excel 365: https://criteriacorp.helpdocs.io/article/dy5pk4asss-microsoft-excel-365
- Wall Street Prep · Excel Crash Course: https://www.wallstreetprep.com/self-study-programs/excel-crash-course/
- CFI · Excel Skills for Professionals: https://corporatefinanceinstitute.com/specializations/excel-skills-for-professionals
- Coursera / Macquarie · Excel Skills for Business: https://www.coursera.org/specializations/excel

**Secundarias o no verificadas (en el texto llevan su marca de verificación: [VERIFICADO], [CORREGIDO] o [NO VERIFICABLE]):**
- Panko, «Spreadsheet Errors: What We Know…» (arXiv): https://arxiv.org/pdf/0802.3457
- Retirada de COPILOT(), MC1454373: https://mc.merill.net/message/MC1454373 · https://www.windowscentral.com/artificial-intelligence/microsoft-copilot/microsoft-is-ditching-the-copilot-function-in-excel-before-it-even-launches
- Infobae / Course Report (Indeed, 531.000): https://www.infobae.com/tecno/2025/09/08/el-programa-de-hace-40-anos-que-aun-es-la-habilidad-mas-buscada-en-el-mercado-laboral-di-hola-excel/
- SHL: https://www.shl.com/products/product-catalog/view/microsoft-excel-365-new (redirige) · Kenexa: https://www.jobtestprep.com/kenexa-excel-power-user
- Extractos de ofertas: Randstad (randstad.com/jobs/…, caducadas), JobTeaser/Manpower, Michael Page (finance transformation, FBP), Hays vía Jooble, InfoJobs (bloqueado).
- FUNDAE ADGG021PO e IFCT153 (sin descarga): https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/especialidades-formativas/ADGG021PO.pdf · https://www.fundae.es/docs/default-source/convocatorias-de-subvenciones/turismo-2023/especialidades-formativas/IFCT153.pdf
- Guías de pruebas prácticas: https://hashtagcapacitaciones.com/prueba-de-excel/ · https://ninjadelexcel.com/pruebas-de-excel-para-el-proceso-de-seleccion/
- Jobsolv (porcentajes de analistas de marketing): https://jobsolv.com/blog/excel-for-marketing-analysts
