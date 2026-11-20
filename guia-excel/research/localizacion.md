# Excel en español de España: trampas de localización

Fecha: 14/11/2026. Va con `es-referencia.json` (301 funciones, 19 errores, cinta, 36 cuadros de diálogo, 85 atajos de Windows, 29 de Mac y 151 términos).
Marcas: [VERIFICADO: fuente] y [SIN VERIFICAR].

## Correcciones de la verificación (2.ª pasada)

Revisión del 14/11/2026. **Esta sección prevalece sobre el resto de este archivo** (salvo `verificaciones.md`, que prevalece sobre todo). Lo que aquí sale como «no verificable» no se enseña como dato. En `es-referencia.json` cada función, error y atajo revisado lleva ahora `"verificado": true|false` y una `nota_verificacion` con las fuentes.

**Criterio.** Las páginas de Microsoft en español no bastan, aunque digan lo mismo en el título, la sintaxis y la lista: PERCENTOF sale igual en las tres y en Excel en español se llama PORCENTAJEDE. Un nombre cuenta como verificado cuando, además de Microsoft, hay una fuente independiente que lo muestre en un Excel en español de verdad. Valen fórmulas de un MVP o de un usuario, un foro de Microsoft, la tabla extraída de Excel (excel-translator) o la ayuda en español de Apple Numbers, que copia los nombres de Excel.

### Nombres que cambian

| Inglés | Antes ponía | Excel en español | Pruebas |
|---|---|---|---|
| MAKEARRAY | MAKEARRAY («ARCHIVOMAKEARRAY» parecía un error) | **ARCHIVOMAKEARRAY** | Fórmulas reales del MVP Ismael Romero (Excelforo, 2022 y 2023): `=ARCHIVOMAKEARRAY(3;2;LAMBDA(fila;col;--(fila&col)))`. También la lista alfabética de Microsoft es-ES y la ayuda en español de Apple Numbers. Es un nombre raro, pero es el real. |
| PERCENTOF | PERCENTOF | **PORCENTAJEDE** | Usuario de Excel en español en Microsoft Q&A (29/09/2024): `=AGRUPARPOR(A1:A15;D1:D15;PORCENTAJEDE;;1)`. También Exceleinfo (MVP, 01/12/2023) y Desafiando Excel (07/11/2024). Microsoft es-ES lo deja en inglés por error, y en otros idiomas sí lo traduce: PROZENTVON en alemán, POURCENTAGEDE en francés y PORCENTAGEMDE en portugués de Brasil. |
| TRIMRANGE | RECORTARRANGO | **No verificable** | Hay cuatro nombres distintos. Microsoft pone «RECORTAR.RANGO» en el título, «RECORTARRANGO» en la sintaxis y «TRIMRANGE» en la lista. El Tío Tech (13/01/2025) y un vídeo de Exceleinfo dicen «RANGORECORTE». No se enseña el nombre: se enseñan las **referencias de recorte** (`A2:.A1000`, `A:.A`), que se escriben igual en cualquier idioma. |

### Nombres dudosos que se confirman

- **Funciones de LAMBDA**: se escriben en inglés **MAP, REDUCE, SCAN, BYROW, BYCOL e ISOMITTED**. Excelforo las usa en fórmulas reales, con `;` y nombres españoles alrededor (`=SCAN(0;A1:A6;LAMBDA(acum;param1;acum+param1))`). La ayuda en español de Apple Numbers las da igual. «MAPEAR» y «ESCANER», de la lista de Microsoft, son errores. **LET** y **LAMBDA** también se escriben igual.
- **COVARIANCE.P** se queda en inglés y la muestral es **COVARIANZA.M**. Lo dan la tabla de excel-translator, extraída de Excel (el español da COVARIANCE.P; el gallego y el italiano, COVARIANZA.P), Píldoras de Excel (2017) y el curso en español de LinkedIn Learning. El título «COVARIANZA.P» de Microsoft es-ES es una errata.
- **Expresiones regulares**: **REGEXPRUEBA**, **REGEXEXTRACCION** (sin tilde) y **REGEXREEMPLAZAR**. Lo confirman Gonduana (07/01/2025), un traductor que las usa en Excel 365 en español y comenta los nombres, y Excel Contabilidad y TIC (04/09/2025), con `=REGEXEXTRACCION(A2;"[0-9()]+[0-9-]")`. «REGEXEXTRAE», «PRUEBA DE REGEX» y similares de Microsoft son errores.
- **AGRUPARPOR** y **PIVOTARPOR** aparecen en un foro de Microsoft, en Exceleinfo y en Desafiando Excel. «DINAMPOR» y «DIVOTARPOR», que salen en páginas de Microsoft, son erratas.
- **TRADUCIR**: Gonduana (03/03/2025) la usa con `;` y explica que en inglés se llama TRANSLATE.
- **Matrices dinámicas y texto**: FILTRAR, ORDENAR, ORDENARPOR, UNICOS, SECUENCIA, MATRIZALEAT, BUSCARX, COINCIDIRX, TEXTOANTES, TEXTODESPUES, DIVIDIRTEXTO, APILARV, APILARH, ENCOL, ENFILA, AJUSTARFILAS, AJUSTARCOLS, TOMAR, EXCLUIR, EXPANDIR, ELEGIRCOLS, ELEGIRFILAS y MATRIZATEXTO. Excelforo las usa en fórmulas reales o en su entrada «14 nuevas funciones» (08/2022), y la mayoría salen también en la ayuda en español de Apple Numbers. Ojo: Apple escribe TEXTO.ANTES, BUSCAR.X y COINCIDIR.X, pero son sus propios nombres y no los de Excel.
- **UNICOS**: Microsoft lo escribe así en el título, Excelforo en fórmulas, y también Apple Numbers, Tech Community y HyperFormula. La lista y la sintaxis de Microsoft dicen «UNIQUE» por error, y ONLYOFFICE copia ese error.
- **SIFECHA**, **SI.ND** y **CAMBIAR**: confirmadas por excel-translator y por fórmulas de Excelforo (`=SIFECHA(B2;C2;"y")`, `=CAMBIAR($B$3;"ES";España;…)`).

### Probables, pero no verificables (no enseñarlos como dato)

- **IMAGEN** y **DETECTARIDIOMA**: solo Microsoft es-ES las da, aunque lo hace de forma coherente, y de IMAGEN hay una nota de prensa. No se encontró a nadie que las use en un Excel en español. La hoja de práctica no las calcula: se pueden mencionar, pero sin preguntas de examen sobre el nombre.

### Valores de error

- **Confirmados**: `#¡DESBORDAMIENTO!`, `#¡CAMPO!`, `#¡BLOQUEADO!` (encabezado de la ayuda de Python de Microsoft es-ES y clasesexcel.com) y `#OBTENIENDO_DATOS`.
- **La palabra es segura, los signos no**: `#¡CALC!`, `#¡CONECTAR!`, `#¡DESCONOCIDO!`, `#OCUPADO` y `#PYTHON!`. Microsoft es-ES quita la «¡» incluso en `#¡VALOR!` (escribe «#VALOR!»), así que su forma no prueba nada. Para OCUPADO, Microsoft escribe «#OCUPADO» y «#¡OCUPADO!», y Excelforo, «#OCUPADO!». En la guía, cada error se escribe como lo muestre la hoja de práctica y no se pregunta por los signos en los exámenes.

### Atajos de Windows

- **Cerrar el libro**: Ctrl+R o Ctrl+F4. Ctrl+W no se ha podido probar en español.
- **Reemplazar**: Ctrl+L. En el Excel en inglés, Ctrl+L crea una tabla; en español, la tabla se crea con Ctrl+T. Que Ctrl+Q también cree tablas no se confirma (Ctrl+Q abre el Análisis rápido).
- **Fecha de hoy**: **Ctrl+,** (coma), según Excel Total y la página de Microsoft sobre fecha y hora. **Hora**: Ctrl+Mayús+. (es decir, Ctrl+:).
- **Actualizar**: solo se confirma **Ctrl+Alt+F5** (todo el libro). El «Ctrl+F5» que daba Microsoft choca con su propia página, donde Ctrl+F5 restaura el tamaño de la ventana.
- **Teclas de la cinta**: Archivo **A**, Inicio **O**, Insertar **B**, Disposición de página **C**, Fórmulas **U**, Datos **D**, Revisar **R** y Vista **N**. Lo dicen dos fuentes españolas independientes, Think Big (2019) y Profesional Review (17/11/2025), y Microsoft confirma la O y la U. Revisar solo sale en Profesional Review, pero en inglés también es R.
- **Formato número, moneda y porcentaje** (Ctrl+Mayús+! $ %): la tecla física es la misma en los teclados español y de EE. UU. (1, 4 y 5), así que se mantienen.
- **Sin confirmar en el teclado español** (se enseña la ruta de la cinta): mostrar fórmulas con Ctrl+` (Fórmulas > Mostrar fórmulas), mostrar filas ocultas con Ctrl+Mayús+( (clic derecho > Mostrar), y los formatos Fecha con `#`, General con `~` y borde con `&` (Ctrl+1 o Inicio > Bordes). Tampoco el editor de Python con Ctrl+Alt+Mayús+P.
- **Argumentos de función, Ctrl+E**: viene de la fuente primaria y encaja con la localización, pero no se ha probado en un equipo. Es prescindible: también se abre con el botón fx.

**Aviso para la app.** `construir.cjs` copia en la referencia de la app todas las funciones, errores y atajos, sin mirar `verificado`. Conviene filtrar o marcar los que tengan `verificado: false`.

## 0. Aviso: la ayuda de Microsoft en español no es fiable en 2025-2026

Las páginas `support.microsoft.com/es-es` se han retraducido de forma automática y tienen errores graves. Una página puede dar mal el nombre de la función o mezclar en una misma frase la sintaxis inglesa con la española. No hay que copiar un nombre de una sola fuente. Ejemplos comprobados en esas páginas:

| Página o lista de Microsoft es-ES dice | Excel real | Prueba |
|---|---|---|
| «Función CONSULTAV» (título de la página de VLOOKUP) | **BUSCARV** | CONSULTAV fue el nombre de la beta de Excel 2010; se retiró. El cuerpo de la misma página usa BUSCARV |
| «Función VERDAD» | **VERDADERO** | excel-translator y HyperFormula |
| «Función HORA.DET» (TIME) | **NSHORA** | ídem |
| «Función VALFECHA» | **FECHANUMERO** | ídem |
| «DIASLABINTL», «DÍAS DE RED. INTL» | **DIAS.LAB.INTL** | ídem |
| «AGREGADO» (lista alfabética) | **AGREGAR** | la página de la función |
| «CORREGIDO» (FIXED) | **DECIMAL** | excel-translator |
| «NOSQL» (DB) | **DB** | ídem |
| «AND», «COUNT», «ROUND», «MID», «LEN», «LOWER»… (títulos sin traducir) | Y, CONTAR, REDONDEAR, EXTRAE, LARGO, MINUSC | ídem |
| «XLOOKUP», «UNIQUE» (listas) | BUSCARX, UNICOS | páginas de las funciones |
| «MAPEAR», «ESCANER», «ARCHIVOMAKEARRAY» | MAP y SCAN; **ARCHIVOMAKEARRAY sí es el nombre real** de MAKEARRAY | [CORREGIDO 2.ª pasada, ver arriba] |
| «#N/A» en las páginas de error | **#N/D** | «Detectar errores de fórmula» es-ES y HyperFormula |
| «SIERROR», «HIPERVÍNCULO» (en la sintaxis) | SI.ERROR, HIPERVINCULO | excel-translator |

Fuente de referencia para las funciones clásicas: la tabla ES↔EN de https://es.excel-translator.de/funciones/, extraída de Excel (Mourad Louha, MVP). Llega hasta Excel 2019. Para las funciones modernas se han cruzado la página de la función, la lista oficial alfabética, la lista por categoría y webs en español.

## 1. Separadores y formato de números

- **Argumentos con `;`**: `=SI(A2>100;"Alto";"Bajo")`. Todos los tutoriales en inglés usan `,`. El separador no depende del idioma de Excel, sino del «separador de listas» de Windows o macOS. En España es `;`.
- **Decimal `,`** y **miles `.`**: `1.234,56`. Si alguien escribe `=A1*1.21`, Excel en España lo toma como texto o como fecha (1 de dic.), y el resultado sale mal.
- **Constantes de matriz**: las columnas se separan con `\` y las filas con `;`: `={1\2\3;4\5\6}` [VERIFICADO: https://support.microsoft.com/es-es/excel/use-array-constants-in-array-formulas]. En inglés sería `{1,2,3;4,5,6}`.
- **Fechas**: se escriben `dd/mm/aaaa`. Escribir `03/04/2026` da el 3 de abril. Una fecha que se queda alineada a la izquierda es texto, no fecha.
- **Códigos de formato en español**: el año es `aaaa`, no `yyyy` [VERIFICADO: https://support.microsoft.com/es-es/excel/format-numbers-as-dates-or-times]. Ejemplos: `=TEXTO(A2;"dd/mm/aaaa")`, `=TEXTO(B2;"#.##0,00 €")`. Si un libro hecho en inglés usa `TEXTO(…;"yyyy")`, el código no se traduce y en Excel en español muestra «yyyy» tal cual [SIN VERIFICAR en equipo].
- **SIFECHA** es la excepción: sus unidades siguen en inglés, `"Y"`, `"M"`, `"D"`, `"MD"`, `"YM"` y `"YD"`; no existe `"A"` [VERIFICADO: página es-ES de SIFECHA]. Es una función oculta: no aparece en el autocompletado.
- Los **criterios** van entre comillas: `">100"`, `"<>"&A1`, `"*Madrid*"`.

## 2. Nombres que confunden

- **TRAMPA DECIMAL**: la función española `DECIMAL` es la inglesa FIXED: redondea y devuelve texto. La inglesa DECIMAL se llama aquí `CONV.DECIMAL`.
- `NSHORA` construye una hora (es TIME). `HORA` extrae la hora (es HOUR).
- `RESIDUO` es MOD, `ESPACIOS` es TRIM, `EXTRAE` es MID, `LARGO` es LEN, `HALLAR` es SEARCH y `ENCONTRAR` es FIND. `SUBTOTALES` va en plural.
- Algunos nombres llevan punto y otros no: `ES.PAR` y `ES.IMPAR` llevan punto, pero `ESNUMERO`, `ESBLANCO` y `ESTEXTO` no.
- Las versiones .S y .P no se traducen igual: `DESVEST.M` (STDEV.S) frente a `VAR.S`, que se queda sin traducir. `COVARIANZA.M` frente a `COVARIANCE.P` [VERIFICADO 2.ª pasada: COVARIANCE.P se queda en inglés].
- Muchos nombres van **sin tilde**: RAIZ, DIA, DIAS, INDICE, DIRECCION, CARACTER, CODIGO, NUMERO.ROMANO, ESNUMERO, ESLOGICO, HIPERVINCULO, PRONOSTICO, INTERSECCION.EJE, JERARQUIA, K.ESIMO.MAYOR, UNICOS, TEXTODESPUES y REGEXEXTRACCION. Solo `AÑO` y `FRAC.AÑO` llevan Ñ. Las listas de Microsoft ponen tildes que Excel no lleva (DIRECCIÓN, ÍNDICE, CARÁCTER).
- `JERARQUIA.EQV`, no «.EQ». `REDOND.MULT`, no «REDONDEAR.MULT». `REDONDEA.PAR`, no «REDONDEAR.PAR».
- `SI.ERROR` y `SI.ND` llevan punto. `SI.CONJUNTO` es IFS. `CAMBIAR` es SWITCH. `XO` es XOR. `Y` es AND, `O` es OR y `NO` es NOT.
- Booleanos: `VERDADERO` y `FALSO`. En BUSCARV, la coincidencia exacta se pide con `FALSO` o con `0`.

## 3. Funciones modernas (2021-2026)

- **Comprobadas en Microsoft es-ES y otras fuentes**: BUSCARX, COINCIDIRX, FILTRAR, ORDENAR, ORDENARPOR (junto), UNICOS, SECUENCIA, MATRIZALEAT, MATRIZATEXTO, VALORATEXTO, TEXTOANTES, TEXTODESPUES, DIVIDIRTEXTO, APILARV, APILARH, ENFILA, ENCOL, AJUSTARFILAS, AJUSTARCOLS, TOMAR, EXCLUIR, ELEGIRFILAS, ELEGIRCOLS, EXPANDIR, IMAGEN, AGRUPARPOR, PIVOTARPOR, REGEXPRUEBA, REGEXEXTRACCION, REGEXREEMPLAZAR, TRADUCIR, DETECTARIDIOMA, HISTORIALCOTIZACIONES. LET y LAMBDA se escriben igual que en inglés. [2.ª pasada: IMAGEN y DETECTARIDIOMA pasan a «no verificables»; ver arriba]
- [CORREGIDO 2.ª pasada: MAP, REDUCE, SCAN, BYROW, BYCOL e ISOMITTED se escriben en inglés (VERIFICADO); MAKEARRAY es **ARCHIVOMAKEARRAY**] **Probable, sin comprobar en un Excel real**: MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY e ISOMITTED se escribirían igual que en inglés. Las páginas es-ES y coddy.tech lo indican así. La lista alfabética dice «MAPEAR», «ESCANER» y «ARCHIVOMAKEARRAY», que parecen traducciones automáticas.
- [CORREGIDO 2.ª pasada: PERCENTOF es **PORCENTAJEDE**; TRIMRANGE sigue sin confirmar y no se enseña su nombre] **Sin comprobar, por contradicciones**: para TRIMRANGE, la página dice «RECORTAR.RANGO» en el título y «RECORTARRANGO» en la sintaxis, y las listas la dejan en inglés. PERCENTOF aparece sin traducir en todas las fuentes. Conviene enseñar las dos en inglés y en español y pedir a la alumna que lo compruebe con el autocompletado.
- **COPILOT() se retiró el 14/09/2026** [VERIFICADO: https://support.microsoft.com/es-es/excel/functions/copilot-function y la versión en-us]. Si se recalcula, da #¿NOMBRE?. Ahora se usa el panel de Copilot (Alt+C). No debe enseñarse como función disponible.
- **Versiones**: dinámicas y LET desde Excel 2021. Texto y matrices de 2022 (14 funciones), LAMBDA con sus auxiliares e IMAGEN desde Excel 2024 [VERIFICADO: https://support.microsoft.com/es-es/excel/what-s-new-in-excel-2024-for-windows-and-mac]. AGRUPARPOR, PIVOTARPOR, PERCENTOF, TRIMRANGE, REGEX*, TRADUCIR, PY e HISTORIALCOTIZACIONES solo funcionan en Microsoft 365. La página de PIVOTBY dice «2021/2024», pero no figura en las novedades de 2024. En la oficina conviene preguntar primero qué versión hay: con BUSCARX en Excel 2019 sale #¿NOMBRE?.

## 4. Valores de error en español

`#¡DIV/0!`, `#N/D`, `#¿NOMBRE?`, `#¡REF!`, `#¡VALOR!`, `#¡NUM!` y `#¡NULO!` [VERIFICADO]. `#¡DESBORDAMIENTO!`, `#¡CALC!` y `#¡CAMPO!` [VERIFICADO, con variantes sin «¡» en Microsoft]. `#OBTENIENDO_DATOS` [VERIFICADO]. Fuentes secundarias para `#¡CONECTAR!`, `#¡BLOQUEADO!` y `#¡DESCONOCIDO!` [2.ª pasada: #¡BLOQUEADO! VERIFICADO; en CALC, CONECTAR, DESCONOCIDO, OCUPADO y PYTHON los signos siguen sin confirmar, ver arriba]. Sin comprobar: `#OCUPADO` o `#OCUPADO!` (BUSY) y `#¡PYTHON!`. `#####` no es un error: la columna es estrecha.

## 5. Atajos de teclado: los que cambian respecto al inglés (Windows)

| Acción | España | Inglés |
|---|---|---|
| Guardar | **Ctrl+G** | Ctrl+S |
| Negrita / Cursiva / Subrayado | **Ctrl+N / Ctrl+K / Ctrl+S** | Ctrl+B / I / U |
| Buscar / Reemplazar / Ir a | **Ctrl+B / Ctrl+L / Ctrl+I** | Ctrl+F / H / G |
| Nuevo libro / Abrir / Cerrar | **Ctrl+U / Ctrl+A / Ctrl+R** | Ctrl+N / O / W |
| Seleccionar todo | **Ctrl+E** | Ctrl+A |
| Rellenar abajo / derecha | **Ctrl+J / Ctrl+D** | Ctrl+D / R |
| Relleno rápido | **Ctrl+Mayús+E** | Ctrl+E |
| Hipervínculo | **Ctrl+Alt+K** | Ctrl+K |
| Argumentos de función | **Ctrl+E** tras el nombre (fuente primaria; no probado en equipo) | Ctrl+A |

Fuentes: https://exceltotal.com/atajos-de-teclado-en-excel/ (dice que están «probados en versiones de Excel en español») y la página de atajos de Microsoft es-ES. **Cuidado**: la tabla «más usados» de Microsoft es-ES contiene restos del inglés, como «Guardar Ctrl+S», «Rellenar abajo Ctrl+D», «Crear tabla Ctrl+L» y «Alt+H Inicio».
Son iguales en los dos idiomas: Ctrl+C, X, V y Z; Ctrl+Y; Ctrl+Alt+V; Ctrl+1; F2; F4 ($); F9; Alt+Intro; Ctrl+Intro; Ctrl+T (crear tabla); Ctrl+Q (análisis rápido); Ctrl+Mayús+L (filtros); Alt+= (Autosuma); Ctrl+flechas; Ctrl+Mayús+flechas; Ctrl+Inicio y Ctrl+Fin; Ctrl+Av Pág y Re Pág; Ctrl+9 y 0; Ctrl+` (mostrar fórmulas; [2.ª pasada: sin confirmar en teclado español]); Mayús+F3; Ctrl+F3; Mayús+F11; Alt+F8, F11 y F12.
Fecha y hora: la fecha es `Ctrl+;` según Microsoft es-ES. En un teclado español eso es Ctrl+Mayús+coma, y en muchos equipos sirve `Ctrl+,`. [2.ª pasada: enseñar `Ctrl+,`] La hora es `Ctrl+Mayús+.`, que equivale a `Ctrl+:` [VERIFICADO: https://support.microsoft.com/es-es/Excel/insert-the-current-date-and-time-in-a-cell].
Los atajos con símbolos (`Ctrl+Mayús+! $ % # & ~`) se pensaron para el teclado de EE. UU. En el español, la tecla física cambia, y hay que comprobarlos en el equipo.
Teclas de acceso de la cinta en español: Archivo **A**, Inicio **O** y Fórmulas **U** [VERIFICADO por secuencias de Microsoft: «ALT+O, S, O», «Alt+U, I, D»]. Insertar **B**, Disposición de página **C**, Datos **D**, Revisar **R** y Vista **N** salen de fuentes secundarias [2.ª pasada: VERIFICADO con dos fuentes españolas independientes]. Siempre se puede pulsar Alt y leer las letras.
En Mac, los atajos con Cmd no se traducen: Cmd+S, Cmd+B, Cmd+F. Cmd+T alterna los $.

## 6. CSV, importación y archivos compartidos

- Si se guarda «CSV (delimitado por comas)» en un equipo configurado para España, el archivo sale **separado por `;`** con decimales con coma. Un programa extranjero lo leerá como una sola columna. A la inversa, un CSV americano con `,` y punto decimal abierto con doble clic queda todo en la columna A o con números convertidos en fechas o textos.
- La forma correcta es usar **Datos > Obtener datos > De texto/CSV**, que abre Power Query. Ahí se elige «Origen del archivo: 65001: Unicode (UTF-8)» y el delimitador, y después se usa **Cambiar tipo > Usar configuración regional** (p. ej. Inglés (Estados Unidos)) para las columnas de números y fechas. Para un caso suelto basta `VALOR.NUMERO(texto;".";",")`.
- «CSV (delimitado por comas)» guarda en ANSI y estropea tildes y «ñ» en otros sistemas. Es mejor «CSV UTF-8 (delimitado por comas)».
- Fechas americanas (mm/dd): «04/03/2026» puede ser el 4 de marzo o el 3 de abril. Hay que comprobar con días mayores de 12 o importar con la configuración regional.
- Los .xlsx guardan las fórmulas en inglés y Excel las muestra traducidas al abrirlas. Lo que no se traduce es el texto pegado de una web o de ChatGPT, ni los códigos dentro de `TEXTO(...)`.

## 7. Cinta y vocabulario

- La pestaña de impresión aparece como **«Disposición de página»** en guías recientes de Microsoft 365 (GoSkills, Platzi), pero la ayuda de Microsoft es-ES sigue diciendo **«Diseño de página»**. Hay que enseñar los dos nombres [SIN VERIFICAR cuál muestra hoy la interfaz]. Developer se llama **Programador**, no «Desarrollador».
- Spill se traduce como **desbordamiento** y en la calle se dice «derrame». Slicer es **Segmentación de datos**, Fill handle **Controlador de relleno**, Goal Seek **Buscar objetivo**, Unpivot **Anular dinamización de columnas** y Watch Window **Ventana Inspección**.

## 8. Diferencias en la hoja de práctica (HyperFormula 3.5.0 esES, probado en local)

1. **VERDADERO y FALSO sin paréntesis dan #¿NOMBRE?**, así que `=BUSCARV(2;A1:C3;3;FALSO)` falla. Se arregla así: `hf.addNamedExpression('VERDADERO','=VERDADERO()')` y lo mismo con FALSO (probado).
2. Hay nombres distintos de los de Excel: IFNA (Excel: SI.ND), SWITCH (CAMBIAR; en esES el nombre está vacío), FILTER (FILTRAR), DÍAS (DIAS), DATEDIF (SIFECHA), XOR (XO), CEILING.MATH (MULTIPLO.SUPERIOR.MAT), ISOWEEKNUM (ISO.NUM.DE.SEMANA), ISFORMULA (ESFORMULA), UNICHAR (UNICAR), ARABIC (NUMERO.ARABE) y PDURATION (P.DURACION). Se arregla copiando `esES.functions` y sobrescribiendo esos nombres antes de `registerLanguage` (probado; el código está en el JSON).
3. **No existen**: PROMEDIO.SI.CONJUNTO, BUSCAR, INDIRECTO, CONCAT, LET, LAMBDA, COINCIDIRX, ORDENARPOR, MATRIZALEAT, AGREGAR, JERARQUIA.EQV, MODA.UNO, TEXTOANTES, TOMAR, AGRUPARPOR, REGEX… Funcionan BUSCARX, FILTER, ORDENAR, UNICOS, SECUENCIA, APILARV, SUMAR.SI.CONJUNTO, CONTAR.SI.CONJUNTO, MAX.SI.CONJUNTO y SI.ERROR.
4. `TEXTO` usa códigos ingleses: `TEXTO(1234,5;"#.##0,00")` da "1234.50,00" y `"dd/mm/aaaa"` da "14/11/aaaa".
5. `{1\2\3}` da #ERROR! y no se puede configurar. Hay que usar SECUENCIA(1;3) o TRANSPONER({1;2;3}).
6. SIFECHA solo acepta las unidades en mayúscula. Los errores #CYCLE! y #ERROR! son propios de HyperFormula: Excel muestra un aviso o el cuadro «Hay un problema con esta fórmula».
