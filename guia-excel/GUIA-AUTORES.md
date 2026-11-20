# Guía para quien escribe el contenido de «Hoja a hoja»

«Hoja a hoja» es una guía interactiva de Excel en español de España para **una mujer adulta que parte de cero** y que al terminar debe **llevar proyectos completos sola en una empresa**. Tú escribes uno o varios módulos (o un proyecto) en JSON. La aplicación ya existe: tu trabajo es el contenido, y tiene que salir **perfecto a la primera**: exacto, claro y práctico.

Carpeta de trabajo: `/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel` (en adelante `EXCEL/`).

## 0. Lo más importante (léelo dos veces)

El cliente quiere **el mejor curso de Excel del mundo**. Eso se decide en tres cosas, por este orden:

**A. Que aprenda cosas útiles que usará de verdad en una empresa.** Nada de ejemplos de juguete («notas de alumnos», «frutas»). Todo ocurre en **Electro Cierzo Suministros, S.L.**, una distribuidora de material eléctrico de Zaragoza (58 personas, delegaciones en Pamplona y Lleida, usa un programa de gestión que exporta CSV y Microsoft 365). **La alumna es la administrativa recién incorporada** y cada lección resuelve algo que le pide un compañero:
- **Carmen Soler**, directora general: breve, quiere «la película entera» en una página.
- **Marta Ruiz**, directora financiera: precisa, con prisa (facturas, cobros, IVA, bancos, presupuestos).
- **Javier Ortega**, director comercial: impaciente (ventas, comerciales, comisiones, clientes).
- **Lucía Fernández**, responsable de RRHH: agobiada (plantilla, vacaciones, horas, fechas).
- **Andrés Molina**, jefe de compras y almacén: práctico (pedidos, proveedores, tarifas, stock).
- **Nuria Campos**, administrativa veterana y su compañera de mesa: le enseña trucos y le avisa de los errores típicos (úsala para los avisos «truco» y «cuidado» cuando encaje).
Productos: cable, canaleta, tubo corrugado, bridas, mecanismos, luminarias LED, magnetotérmicos. Clientes: instaladores y empresas (inventados). «Hoy» en la ficción: semana del 16/11/2026.
Hilo de la historia por niveles: N0 su primer día · N1 su primera semana · N2 su primer mes · N3 ya es del equipo y le llegan los informes · N4 le piden que el trabajo repetitivo se haga solo · N5 es la referencia de Excel de la oficina · N6 lleva sus propios proyectos.

Cada lección lleva un campo **`mision`**: `{"de":"Marta Ruiz","puesto":"Directora financiera","texto":"mensaje corto y natural con lo que necesita (2-3 frases, como un correo o un chat real)","logro":"Ya sabes … (lo que ha aprendido, dicho como una habilidad de trabajo)"}`. La lección enseña justo lo que hace falta para resolver ese encargo, y el **último ejercicio de los bloques resuelve la misión** con los datos del encargo. Dentro de la lección puedes usar bloques **`{"tipo":"mensaje","de":"Nuria Campos","puesto":"Administración","md":"…"}`** (un mensaje de un compañero) para dar contexto, un aviso o un giro («ha cambiado el IVA de este producto»).

**B. El método de enseñanza (basado en investigación; no es opcional).** Cada regla sale de estudios revisados (están en `research/pedagogia.md` §0 y §1):
1. **Recordar sin mirar enseña más que releer** (Roediger y Karpicke 2006): por eso cada lección acaba con «recuerda» y cada módulo empieza con repaso. Las preguntas piden **producir** (escribir la fórmula, predecir), no reconocer.
2. **Ejemplo resuelto → ejemplo a medias → problema entero** (Renkl et al. 2002): el primer ejercicio de un concepto nuevo viene casi hecho (fórmula `inicial` a completar o elegir entre opciones), el siguiente lo hace con pistas, el último sola. Quita la ayuda poco a poco.
3. **Guía clara al principio, exploración después** (Kirschner, Sweller y Clark 2006; Keith y Frese 2008): en N0-N1 explica y muestra antes de pedir; desde N2 deja que pruebe y trata el error como información («equivocarse aquí es gratis»).
4. **Una pantalla, una idea** y el enunciado junto a la hoja (Chandler y Sweller 1996): textos de 70-90 palabras como mucho.
5. **La corrección informa** (Wisniewski, Zierer y Hattie 2020): cada `porque`, cada pista y cada `explicacion` dicen qué pasa, por qué y qué hacer. Nunca un simple «incorrecto».
6. **Mezclar tipos de problema** (Rohrer et al. 2015): en `recuerda`, en `repaso_inicial` y en los exámenes mezcla conceptos para que tenga que **elegir la herramienta**.
7. **Predecir antes de ver** y **arreglar errores**: usa `predice` y fórmulas `inicial` con los errores reales de principiante (la lista E01-E23 está en `research/pedagogia.md` §4: búscala con grep «^### E» y lee el de tu tema).
8. **Enseñar a desconfiar del resultado** (Panko 2015: la mayoría de las hojas de empresa tienen errores): desde N2, algunos ejercicios piden una comprobación (total de control, caso conocido).
9. **Tareas completas de oficina** (4C/ID, van Merriënboer y Kirschner): la misión de cada lección es una tarea real entera, pequeña pero completa.

**C. Que enganche como un videojuego.** La alumna juega la lección pantalla a pantalla con puntos, combos, estrellas y logros (eso lo hace la app). Tu parte: victorias rápidas (el primer ejercicio se acierta casi seguro), ritmo vivo, variedad de tipos de ejercicio, pequeñas sorpresas («¿y si ahora cambia el precio?»), humor de oficina con medida, y un cierre que le haga sentir lo que ya sabe hacer. Tono adulto: nada infantil ni cursi.

## 1. Fuentes que tienes que usar

- `EXCEL/research/blueprint.json` y `blueprint.md`: el temario (qué va en tu módulo, objetivos, errores conceptuales, ejercicios previstos).
- `EXCEL/research/es-referencia.json`: **nombres exactos** de funciones, sintaxis en español, errores, atajos y cinta. Si un nombre, atajo o menú no está ahí verificado, compruébalo en support.microsoft.com/es-es antes de usarlo, o no lo uses.
- `EXCEL/research/pedagogia.md`, `empresa.md`, `excel-moderno.md`, `curriculo.md`, `proyectos.md`, `localizacion.md`: la investigación. Úsala.
- `EXCEL/ejemplo-modulo.json`: **el formato de referencia**, con un ejemplo de cada tipo de bloque y de ejercicio. Cópialo como plantilla.
- `EXCEL/funciones-motor.txt`: funciones que calcula la hoja de práctica.

## 2. Tono y lengua

- Español de España, tuteo, frases cortas, lenguaje llano. Te diriges a ella en femenino cuando haga falta («estás lista», «ya eres capaz»). Nada de «¡Genial!», emojis ni infantilismos: es una adulta que se prepara para trabajar.
- Explica el **porqué** y el **para qué en la empresa**, no solo el cómo.
- Excel para Microsoft 365 en español (Windows) es la referencia. Cuando algo no exista en versiones antiguas (Excel 2016/2019) o en Mac/web, dilo en un aviso y da la alternativa compatible (p. ej. BUSCARX → INDICE + COINCIDIR o BUSCARV).
- Funciones SIEMPRE en español y con `;` entre argumentos, coma decimal (`=REDONDEAR(2,345;2)`). Menús en español: Inicio, Insertar, Disposición de página, Fórmulas, Datos, Revisar, Vista, Automatizar, Programador. Atajos del Excel español (Ctrl+G guarda, Ctrl+N negrita, Ctrl+K cursiva, Ctrl+S subrayado, Ctrl+B buscar…): verifica cada uno en `es-referencia.json`.
- Datos de ejemplo realistas de una empresa española: nombres y apellidos españoles variados, ciudades/provincias, importes en euros, IVA 21 % / 10 % / 4 %, fechas de 2025-2026 en DD/MM/AAAA, NIF con formato plausible pero inventado, productos y clientes creíbles. Nunca datos de personas reales.

## 3. Pedagogía (obligatoria)

**Cómo se ve tu lección.** La alumna la juega **pantalla a pantalla**, como un videojuego: cada bloque de explicación es UNA pantalla (los `aviso`, `hoja` y `atajos` que pongas justo detrás de un `texto` se muestran en esa misma pantalla), y cada ejercicio es otra pantalla. Tiene que poder seguirla alguien que nunca ha abierto Excel («para tontos», en palabras del cliente), y engancharse por la sensación de conseguir cosas reales. Por tanto:
- Cada `texto` = **una sola idea, máximo 70-90 palabras**. Nada de muros de texto. Si necesitas más, divide en dos pantallas con un ejercicio en medio.
- Ritmo: **explica → practica → explica → practica**. Nunca más de 2 pantallas de explicación seguidas sin un ejercicio.
- Una lección típica: 10-16 pantallas, de ellas **6-9 ejercicios** (incluidos los de `recuerda`). La primera práctica, muy fácil (que acierte y se sienta capaz); la dificultad sube poco a poco; el último ejercicio, una mini-tarea de oficina.
- Define cada palabra técnica la primera vez que aparece, con un ejemplo cotidiano. Usa comparaciones simples (una celda es como la casilla de un cuaderno de cuadros; la fórmula es una receta).
- Celebra lo real: en la `explicacion` de los aciertos di qué acaba de conseguir y para qué le servirá en el trabajo («Con esto ya puedes calcular el IVA de cualquier factura»).
- Nivel 0 y 1: lenguaje especialmente sencillo, pasos muy pequeños, mucha práctica de lo mismo con variaciones.

- **Lecciones de 10-20 minutos**, una idea principal cada una.
- Estructura de cada lección: por qué importa → explicación breve con un ejemplo visible (`hoja` o `pasos`) → **ejemplo resuelto** → práctica que va de guiada a autónoma (primero completar, luego hacer sola) → «recuerda» al final (2-3 preguntas de recuperación sin mirar).
- **6-9 ejercicios** por lección contando los de «recuerda». Mezcla tipos: fórmula en vivo, predice, test con retroalimentación por opción, encuentra el error (fórmula `inicial` errónea que ella arregla), ordenar pasos, cinta, respuesta corta, abierta, y en Excel real cuando la herramienta no se puede simular.
- Cada test: cada opción con su `porque` (por qué es correcta o qué confusión revela). Distractores basados en **errores reales** de principiantes, no absurdos.
- Cada ejercicio de fórmula: 3 **pistas graduadas** (de orientar a casi dar la respuesta), `explicacion` que se muestra al acertar, `variantes` (cambia datos de entrada para detectar resultados escritos a mano), `errores_tipicos` (fórmulas equivocadas típicas que DEBEN fallar) y `copiar_a` cuando la gracia está en copiar la fórmula (referencias relativas/absolutas).
- `repaso_inicial` del módulo: 2-4 preguntas de módulos ANTERIORES (intercalado). En el primer módulo del curso, preguntas de sentido común.
- `tarjetas` por lección: 2-5 tarjetas de repaso espaciado (atajos, funciones con su sintaxis, conceptos, errores). Frente = pregunta concreta; dorso = respuesta corta.
- Avisos (`aviso`) con moderación: `atajo`, `cuidado` (errores que cuestan caro), `empresa` (cómo se hace en una oficina de verdad), `truco`, `dato`.
- Conecta con el trabajo real en cada lección: un correo de la jefa, un informe que hay que entregar, una tabla que llega de un ERP.

## 4. Formato del archivo (JSON)

Un archivo por módulo: `EXCEL/contenido/<id_modulo>.json` (p. ej. `n2m3.json`), con la forma exacta de `ejemplo-modulo.json`:

```
{ "id", "nivel", "titulo", "intro", "repaso_inicial": [ejercicios], "lecciones": [ { "id", "titulo", "minutos", "objetivo", "mision": {de, puesto, texto, logro}, "funciones": ["SUMA"], "bloques": [...], "recuerda": [ejercicios], "tarjetas": [{tipo, frente, dorso}] } ], "practica_excel": null | {...} }
```

Ids: módulo `n2m3`; lecciones `n2m3l1`, `n2m3l2`…; ejercicios `n2m3l1-e1`, `n2m3l1-q1` (recuerda), `n2m3-r1` (repaso inicial). Únicos.

### Texto con formato (campos `md`, `enunciado`, `pregunta`, `explicacion`, `pistas`, `porque`…)
Subconjunto de Markdown: `**negrita**`, `*cursiva*`, `` `código o fórmula` ``, teclas con dobles corchetes `[[Ctrl]]+[[G]]`, listas con `- ` o `1. `, tablas con `|`, subtítulos `### `, citas `> `, enlaces `[texto](https://…)`. Nada de HTML ni imágenes.

### Bloques
- `{"tipo":"texto","md":"…"}`
- `{"tipo":"aviso","estilo":"atajo|cuidado|empresa|truco|dato","titulo":"…","md":"…"}`
- `{"tipo":"hoja","titulo":"…","hoja":HOJA,"resaltar":["D2:D3"],"mostrar_formulas":true,"pie":"…"}` — hoja de ejemplo calculada en vivo (solo funciones del motor).
- `{"tipo":"pasos","titulo":"Ejemplo resuelto","pasos":[{"md":"…","hoja":HOJA opcional,"ruta":["Datos","Ordenar y filtrar","Filtro"] opcional}]}`
- `{"tipo":"tabla","titulo":"…","cabecera":["…"],"filas":[["…"]],"pie":"…"}`
- `{"tipo":"cinta","md":"…","ruta":["Inicio","Estilos","Formato condicional"]}` — muestra la cinta con el botón marcado.
- `{"tipo":"atajos","atajos":[{"teclas":"Ctrl+G","accion":"Guardar"}]}`
- `{"tipo":"comparar","izq":"Así no","der":"Así sí","filas":[["…","…"]]}`
- `{"tipo":"mensaje","de":"Nuria Campos","puesto":"Administración","md":"…"}` — un mensaje de un compañero de Electro Cierzo (contexto, aviso o giro de la historia). Corto.
- `{"tipo":"pantalla","md":"…","resaltar":"barra_formulas"}` — una ventana de Excel simulada donde la alumna toca cada parte y se le explica qué es. Zonas: `titulo, guardar, buscar, archivo, pestanas_cinta, cinta, cuadro_nombres, insertar_funcion, barra_formulas, seleccionar_todo, encabezado_columna, encabezado_fila, celda_activa, controlador_relleno, pestanas_hoja, nueva_hoja, barra_estado, zoom`. Úsala sobre todo en el nivel 0.
- `{"tipo":"ejercicio", …}` (ver abajo)

### HOJA
```
{"celdas": {"A1":"Producto","B2":1.5,"C2":{"fecha":"2026-03-01"},"D2":"=B2*C2","E2":{"texto":"001"}},
 "formatos": {"B2:B9":"eur","C2:C9":"fecha","E2":"pct"}, "anchos": {"A":14}, "columnas": 6, "filas": 10}
```
Números como números JSON (punto decimal en el JSON: `1.5`; la hoja lo muestra como 1,50 €). Fechas con `{"fecha":"AAAA-MM-DD"}`. Texto que parece número: `{"texto":"001"}`. Formatos: `eur`, `fecha`, `pct`, `pct1`, `num`, `num2`, `hora` o un código de formato español (`#.##0,00 €`, `dd/mm/aaaa`, `0,0%`, `mmmm aaaa`). Fila 1 = cabeceras (se ponen en negrita). Hojas pequeñas: hasta ~8 columnas y ~15 filas.

### Ejercicios (campo `modo`)
- `formula`: `enunciado`, `hoja`, `objetivo` (celda vacía donde escribe), `solucion`, opcionales `copiar_a` (rangos donde se copia su fórmula), `variantes` ([{celda: nuevoValor}]), `debe_usar`, `no_usar`, `alternativas` (otras soluciones válidas, deben pasar), `errores_tipicos` (deben fallar), `inicial` (fórmula errónea de partida para «arregla el error»), `formato_resultado`, `tolerancia`, `pistas` (3), `explicacion`. La corrección compara su resultado con el de la solución en la celda objetivo, en las copias y en todos los escenarios de `variantes`, y exige las funciones de `debe_usar`.
- `predice`: `enunciado`, `hoja`, `celda`, `formula`, `explicacion` (la respuesta la calcula el validador).
- `test`: `pregunta`, `opciones` [{texto, correcta, porque}], opcional `multiple`, `explicacion`.
- `ordenar`: `enunciado`, `pasos` (en el orden CORRECTO; la app los baraja), `explicacion`.
- `cinta`: `enunciado`, `ruta` [pestaña, grupo, comando] que exista en `EXCEL/app/cinta.json`, `explicacion`.
- `respuesta_corta`: `pregunta`, `aceptadas` (variantes válidas), `explicacion`.
- `abierta`: `pregunta`, `modelo` (respuesta modelo), `criterios` (3-5). La tutora IA la comenta si está disponible; si no, se compara con el modelo.
- `senala`: `pregunta` («Toca la barra de fórmulas»), `zona` (una de las zonas de `pantalla`), `explicacion`. Para aprender las partes de la ventana.
- `excel`: `enunciado` (tarea en su Excel), `archivo` (xlsx en `EXCEL/libros/`), `controles` [{pregunta, respuesta (número), tolerancia, pista}], opcionales `solucion_md`, `archivo_solucion`.

### Lo que la hoja de práctica NO calcula
LAMBDA y auxiliares (MAP, REDUCE, BYROW…), AGRUPARPOR, PIVOTARPOR, REGEX, IMAGEN, COPILOT, INDIRECTO, referencias estructuradas (`Tabla1[Importe]`), referencias a otras hojas, tablas dinámicas, Power Query, gráficos, formato condicional, validación de datos, filtros, macros. Para eso usa `test`, `predice` (no), `ordenar`, `cinta`, `tabla`, `pasos` y sobre todo `excel` con un libro descargable.
SÍ calcula (además de lo clásico): LET, CAMBIAR, SI.CONJUNTO, BUSCARX, COINCIDIRX, FILTRAR (con su tercer argumento), ORDENAR, ORDENARPOR, UNICOS, SECUENCIA, APILARV/H, TOMAR, EXCLUIR, ELEGIRCOLS/FILAS, ENCOL/ENFILA, TEXTOANTES/DESPUES, DIVIDIRTEXTO, CONCAT, UNIRCADENAS, PROMEDIO.SI.CONJUNTO, MAX/MIN.SI.CONJUNTO, SIFECHA, DIAS.LAB(.INTL), JERARQUIA.EQV, MODA.UNO, TEXTO con formatos españoles. Lista completa en `funciones-motor.txt`.

## 4 bis. Examen de nivel (`EXCEL/contenido/<nivel>-examen.json`, p. ej. `n2-examen.json`)

Cada nivel termina con un examen (el «jefe final» del nivel), sin pistas, que se aprueba con el 80 % a la primera y da la insignia y el certificado del nivel:
```
{ "nivel":"n2", "titulo":"Examen del nivel 2", "intro":"una frase", "umbral":0.8,
  "preguntas":[ 12-15 ejercicios autocorregibles (formula, predice, test, respuesta_corta, cinta, ordenar, senala) con "leccion":"n2m1l3" (la lección donde se aprende) ] }
```
Cubre todos los objetivos del nivel, con problemas NUEVOS (no copies ejercicios de las lecciones), al nivel de lo que se pide en una empresa. Ids `n2-x1`, `n2-x2`…

## 5. Libros .xlsx de práctica (cuando `practica_excel` o un ejercicio `excel` lo pidan)

- Créalos con Python (`xlsxwriter` preferido; `openpyxl` vale) desde un script guardado en `EXCEL/libros/src/<nombre>.py`, y genera `EXCEL/libros/<nombre>.xlsx`. Nombres de archivo en minúsculas sin tildes: `n3-tablas-dinamicas.xlsx`.
- **En el archivo, las fórmulas se escriben en inglés y con comas** (así se guardan; Excel en español las mostrará traducidas): `=SUMIFS(D2:D200,B2:B200,"Norte")`. Las funciones modernas llevan prefijo: `_xlfn.XLOOKUP`, `_xlfn.XMATCH`, `_xlfn._xlws.FILTER`, `_xlfn._xlws.SORT`, `_xlfn.UNIQUE`, `_xlfn.SEQUENCE`, `_xlfn.LET`, `_xlfn.IFS`, `_xlfn.SWITCH`, `_xlfn.CONCAT`, `_xlfn.TEXTJOIN`, `_xlfn.MAXIFS`… (en xlsxwriter usa `use_future_functions` o escribe el prefijo; las de matriz dinámica con `write_dynamic_array_formula`).
- Estructura: hoja **«Instrucciones»** (primera, en español: objetivo, pasos numerados, qué entregar, cómo comprobar con los totales de control), hojas de datos con nombres en español, datos con los problemas de calidad que pida el ejercicio. Un segundo archivo `…-solucion.xlsx` con la solución hecha (fórmulas reales, tabla dinámica descrita o creada si la librería lo permite, comprobaciones).
- Los **totales de control** (`controles`) los calculas en Python **a partir de los datos** (pandas), nunca a ojo, y los copias al JSON con su tolerancia (0,01 para euros).
- Guarda junto al libro `EXCEL/libros/<nombre>.meta.json` con `{"titulo":"…","descripcion":"una frase","nivel":"n3"}`.
- Comprueba el archivo: ábrelo con openpyxl (que cargue) y, si tiene fórmulas clásicas, recalcúlalo con LibreOffice (`soffice --headless --convert-to xlsx --outdir /tmp/x archivo.xlsx`) y lee los valores para confirmar los controles. (LibreOffice 24.2 no conoce BUSCARX/FILTRAR/LET: para esas, confía en pandas.)

## 6. Validación (obligatoria antes de terminar)

```
cd EXCEL && node validar.cjs contenido/<id>.json --arreglar
```
Debe terminar con **0 errores**. Los avisos revísalos uno a uno (casi todos indican algo mejorable). `--arreglar` rellena las respuestas de los `predice`. No termines con errores.

## 7. Proyectos (`EXCEL/proyectos/pN.json`)

```
{ "id":"p3", "titulo":"…", "departamento":"Administración y finanzas", "nivel_requerido":"n5", "horas":4,
  "resumen":"una frase", "habilidades":["Power Query","BUSCARX", "…"],
  "correo": {"de":"Marta Ruiz (Directora financiera)", "para":"ti", "asunto":"…", "cuerpo":"texto del correo, con ambigüedades a propósito"},
  "preguntas_previas": {"pregunta":"¿Qué le preguntarías antes de empezar?", "modelo":"…", "criterios":["…"]},
  "aclaraciones": [{"pregunta":"…", "respuesta":"lo que contesta la jefa"}],
  "datos_md": "qué hay en los archivos y qué problemas de calidad se esperan (sin desvelarlos todos)",
  "archivos": [{"archivo":"p3-datos.xlsx", "titulo":"Datos de partida", "descripcion":"…"}],
  "pasos": [{"titulo":"Limpiar los datos", "md":"qué hay que conseguir", "pista":"cómo, si se atasca"}],
  "controles": [{"pregunta":"Importe total pendiente de cobro a 31/10/2026 (€)", "respuesta":123456.78, "tolerancia":0.01, "pista":"…"}],
  "entregables": ["…"],
  "rubrica": [{"criterio":"Exactitud", "niveles":["En desarrollo: …","Aceptable: …","Bien: …","Excelente: …"]}],
  "correo_entrega": {"pregunta":"Escribe el correo con el que entregas", "modelo":"…", "criterios":["…"]},
  "solucion_md":"solución comentada paso a paso", "archivo_solucion":"p3-solucion.xlsx",
  "errores_tipicos":["…"], "ampliaciones":["…"] }
```
Los datos se generan con un script Python con semilla fija (`random.seed(…)`), con los problemas de calidad sembrados a propósito y documentados en el propio script. Los controles se calculan con pandas desde los datos LIMPIOS según las reglas del encargo y las aclaraciones. Valida con `node validar.cjs proyectos/pN.json`.

## 8. Prueba de nivel y examen final

`EXCEL/contenido/prueba_nivel.json`: `{"intro":"…","umbral":0.8,"preguntas":[ejercicio con "nivel":"n1" …]}` — solo modos que se corrigen solos (test, predice, respuesta_corta, formula, cinta, ordenar); 3-4 preguntas por nivel, de dificultad representativa de ese nivel.

`EXCEL/contenido/examen.json`: `{"titulo":"…","resumen":"…","duracion":120,"intro":"…","archivos":[{"archivo","titulo","descripcion"}],"partes":[{"titulo","md","ejercicios":[…]}],"rubrica":"md","solucion_md":"md","archivo_solucion":"…"}` — como una prueba técnica de empresa: tareas en el libro con totales de control (`excel`), preguntas de criterio (`test`), y un correo final (`abierta`).

## 9. Avisos de la investigación (obligatorios)

- `research/verificaciones.md` **prevalece** sobre el resto de archivos. Lo marcado [NO VERIFICABLE] no se enseña como dato (ni cifras, ni plazos, ni nombres).
- La función `COPILOT()` **se retiró el 14/09/2026**: no se enseña. Copilot se usa desde su panel (botón Copilot de la pestaña Inicio).
- Pestaña: la ayuda de Microsoft dice a veces «Diseño de página» y Microsoft 365 muestra «Disposición de página». Usa «Disposición de página» y menciona el otro nombre la primera vez.
- Atajos del Excel español (no los de los tutoriales en inglés): Guardar [[Ctrl]]+[[G]], Negrita [[Ctrl]]+[[N]], Cursiva [[Ctrl]]+[[K]], Subrayado [[Ctrl]]+[[S]], Buscar [[Ctrl]]+[[B]], Reemplazar [[Ctrl]]+[[L]], Ir a [[Ctrl]]+[[I]], Seleccionar todo [[Ctrl]]+[[E]], Rellenar hacia abajo [[Ctrl]]+[[J]], Rellenar a la derecha [[Ctrl]]+[[D]], Relleno rápido [[Ctrl]]+[[Mayús]]+[[E]]. Los atajos con símbolos (fecha actual, formatos) dependen del teclado: comprueba en `es-referencia.json` y avisa si cambian con el teclado español.
- Unidades de SIFECHA en inglés: "Y", "M", "D", "MD", "YM", "YD". Formatos de fecha con «aaaa» (no «yyyy»). Constantes matriciales: `{1\2\3}` (columnas con `\`, filas con `;`).
- Desde el **nivel 2**, una parte de los ejercicios describe el **resultado** que se quiere («¿cuántos clientes no tienen teléfono?») sin nombrar la función, como en las pruebas reales de empresa y en MOS. En los exámenes de nivel, casi todos así.
- Practica con **tiempo** a partir del nivel 2 (indica «intenta hacerlo en menos de 3 minutos» en algunas tareas de Excel real): las pruebas de selección siempre tienen tiempo límite.
- Macros/VBA son «valorables» en las ofertas, no obligatorias: no les des más peso que a Power Query.
- La comprobación (cuadres, totales de control, celdas de comprobación, revisar antes de entregar) se practica en TODOS los niveles: la mayoría de las hojas de empresa tienen errores.
- Versiones: BUSCARX, FILTRAR, LET desde Excel 2021; funciones de texto/matriz de 2022 (TEXTOANTES, APILARV…), LAMBDA e IMAGEN desde Excel 2024; AGRUPARPOR, PIVOTARPOR, REGEX, TRADUCIR solo Microsoft 365. Cuando enseñes una moderna, da también la alternativa para versiones antiguas.
