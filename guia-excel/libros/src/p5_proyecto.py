# -*- coding: utf-8 -*-
"""
P5 · Escribe proyectos/p5.json y libros/p5-solucion.meta.json con las cifras de
libros/src/p5_controles.json (calculadas por p5_solucion.py a partir de los datos limpios).
Orden: python3 p5_datos.py && python3 p5_solucion.py && python3 p5_proyecto.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
EXCEL = os.path.dirname(LIBROS)
C = json.load(open(os.path.join(AQUI, "p5_controles.json"), encoding="utf-8"))
A = C["analisis"]
N = C["noviembre"]


def es(x, dec=2):
    s = f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def eur(x, dec=2):
    return es(x, dec) + " €"


def pct(x):
    return es(x, 1) + " %"


D = A["deleg"]
FAM = A["familia"]
COM = A["comercial"]
bajos = sorted([c for c, x in COM.items() if x["margen_pct"] < 22], key=lambda c: COM[c]["margen_pct"])
b1, b2 = bajos
fam_ordenadas = sorted([f for f in FAM if FAM[f]["var"] is not None], key=lambda f: -FAM[f]["var"])

correo_cuerpo = (
    "Hola:\n\n"
    "Cada mes pierdo un día entero montando el informe para la reunión de comerciales: copiar, pegar, cuadrar… "
    "Te he dejado en la carpeta compartida los archivos que saca el ERP de enero a octubre y los maestros.\n\n"
    "Quiero ver cómo vamos por delegación, comercial, familia y cliente, comparado con el año pasado y con el objetivo, "
    "y que el mes que viene solo tenga que darle a un botón. Y que salga el margen, que algunos venden muy barato.\n\n"
    "La reunión es el 25.\n\n"
    "Javier"
)

proyecto = {
    "id": "p5",
    "titulo": "Informe mensual de ventas automatizado",
    "departamento": "Comercial",
    "nivel_requerido": "n4",
    "horas": 10,
    "resumen": "Convierte diez exportaciones del ERP en un informe de ventas que se actualiza con un botón: Power Query desde carpeta, tablas dinámicas, margen, comparación con 2025 y con el objetivo, y dos salidas según quién lo lea.",
    "habilidades": ["Power Query desde carpeta", "Configuración regional", "Combinar y anexar consultas",
                    "Anular dinamización", "Tablas dinámicas", "Mostrar valores como", "Campo calculado",
                    "Segmentaciones y escala de tiempo", "Gráfico combinado", "Minigráficos", "Pareto",
                    "Controles de cuadre", "Actualizar todo"],
    "correo": {
        "de": "Javier Ortega (Director comercial)",
        "para": "ti",
        "asunto": "El informe de ventas de cada mes",
        "cuerpo": correo_cuerpo,
    },
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel: ¿qué le preguntarías a Javier? Escribe el correo con tus preguntas (de 5 a 8, concretas).",
        "modelo": (
            "Hola, Javier:\n\nAntes de empezar, para que el informe salga como lo necesitas:\n"
            "1. «Ventas»: ¿importe sin IVA y restando las devoluciones? ¿Qué hago con los portes y con el descuento por pronto pago?\n"
            "2. ¿Con 2025 comparo el mes, el acumulado o los dos? ¿A qué nivel tenemos datos de 2025 (delegación, comercial, familia)?\n"
            "3. ¿Dónde están los objetivos y a qué nivel (comercial, mes)? ¿Qué ventas cuentan para el objetivo de cada comercial?\n"
            "4. El margen, ¿sobre qué coste: el estándar del maestro o el real de cada venta?\n"
            "5. ¿Quién va a ver el informe? ¿Pueden ver todos los comerciales los márgenes?\n"
            "6. ¿Qué Excel usáis (versión, Windows o Mac)? Para lo del botón me basta con «Actualizar todo»; ¿te vale?\n"
            "7. Si aparecen códigos de producto que no están en el maestro, ¿a quién se los paso y cómo los muestro mientras?\n"
            "8. ¿El periodo es de enero a octubre, por fecha del albarán?\n\n"
            "Con esto te preparo un primer borrador antes de la reunión del 25. Gracias."
        ),
        "criterios": [
            "Pregunta qué es exactamente «venta» (sin IVA, devoluciones, portes, pronto pago).",
            "Pregunta a qué nivel hay datos de 2025 y si compara mes o acumulado.",
            "Pregunta qué coste se usa para el margen.",
            "Pregunta quién verá el informe (confidencialidad de los márgenes).",
            "Pregunta la versión de Excel y qué significa «un botón».",
            "Las preguntas son concretas, numeradas y en un correo breve y educado.",
        ],
    },
    "aclaraciones": [
        {"pregunta": "«Ventas»: ¿sin IVA y netas de devoluciones? ¿Y los portes y el «DTO. PRONTO PAGO»?",
         "respuesta": "Venta neta = ImporteNeto, sin IVA; las devoluciones restan. Los portes van en la familia «Portes y servicios». El pronto pago va a «Ajustes»: no cuenta para los comerciales y sí para el total de la empresa."},
        {"pregunta": "¿Contra el año pasado en qué nivel? ¿Mes o acumulado?",
         "respuesta": "Mes y acumulado, solo por delegación y familia: es lo único que hay de 2025 (hoja Ventas_2025_resumen, y solo de las 6 familias de producto). Por comercial, contra el objetivo."},
        {"pregunta": "¿Dónde están los objetivos? ¿Qué cuenta para el objetivo?",
         "respuesta": "En la hoja Objetivos_2026, por comercial y mes, sin IVA. Para el comercial cuenta todo lo que vende menos «Ajustes»."},
        {"pregunta": "¿Margen sobre qué coste?",
         "respuesta": "Desde julio, el CosteUnitario que trae cada línea. Antes, el CosteEstandar del maestro de productos."},
        {"pregunta": "¿Quién ve el informe?",
         "respuesta": "Dos salidas: «Reunión», para todo el equipo comercial, sin márgenes; y «Dirección», completa, solo para mí y para Carmen."},
        {"pregunta": "¿«Un botón»? ¿Qué Excel tenéis?",
         "respuesta": "Me basta con «Actualizar todo». Todos tenemos Microsoft 365 en Windows."},
        {"pregunta": "¿Y los códigos que no están en el maestro?",
         "respuesta": "Hazme una lista para que Compras los dé de alta; mientras, ponlos en la familia «Sin clasificar»."},
        {"pregunta": "¿Periodo y fecha?",
         "respuesta": "De enero a octubre de 2026, que están cerrados. Manda la fecha del albarán (columna Fecha)."},
        {"pregunta": "¿Y Óscar, que se fue en mayo?",
         "respuesta": "Que salga hasta su baja (15/05). Desde el 16/05 sus clientes los lleva Elena Sancho (V06), y por eso a ella le subimos el objetivo desde junio."},
    ],
    "datos_md": (
        "Descomprime **p5-carpeta-ventas.zip** en tu equipo (por ejemplo, en `C:\\Ventas`). Es la carpeta compartida de Javier:\n\n"
        "| Carpeta o archivo | Qué es |\n|---|---|\n"
        "| `Ventas\\ERP\\` | Lo que exporta el ERP: un CSV por mes, de `ventas_2026_01.csv` a `ventas_2026_10.csv`, unas 12.000 líneas en total |\n"
        "| `Ventas\\Maestros\\p5-datos.xlsx` | El mismo libro que puedes descargar aparte: Control_ERP, Productos, Comerciales, Clientes, Objetivos_2026 y Ventas_2025_resumen |\n"
        "| `Ventas\\Informe\\` | Vacía: aquí guardas tu libro |\n"
        "| `Ventas\\Llega_en_diciembre\\` | **No la abras** hasta el último paso (el cambio inesperado) |\n\n"
        "Columnas de los CSV: Fecha, NumAlbaran, NumFactura, CodCliente, CodProducto (texto de 6 dígitos), Descripcion, Cantidad, "
        "PrecioUnitario, DtoLinea (%), ImporteNeto (sin IVA), Delegacion y CodComercial. **Control_ERP** da el nº de líneas y la suma "
        "de ImporteNeto que el ERP calcula al cerrar cada mes: es la verdad con la que tienes que cuadrar.\n\n"
        "Lo que tienes que esperar (no todo está dicho):\n"
        "- Los archivos los han sacado personas y equipos distintos a lo largo del año: **no todos los meses llegan igual**. Compruébalo con el cuadre de cada mes, no a ojo.\n"
        "- El ERP cambió en verano y algún mes trae información que antes no venía.\n"
        "- La delegación se teclea a mano en el ERP.\n"
        "- El maestro de productos es una exportación de antes del verano.\n"
        "- Javier guarda cosas suyas en la carpeta compartida.\n"
        "- Objetivos y 2025 vienen con los meses en columnas."
    ),
    "archivos": [
        {"archivo": "p5-carpeta-ventas.zip", "titulo": "Carpeta compartida de Javier (ZIP)",
         "descripcion": "Ventas\\ERP con los 10 CSV del ERP (enero-octubre 2026), Maestros, Informe y Llega_en_diciembre (para el último paso)."},
        {"archivo": "p5-datos.xlsx", "titulo": "Maestros y control del ERP",
         "descripcion": "Instrucciones, Control_ERP, Productos, Comerciales, Clientes, Objetivos_2026 y Ventas_2025_resumen (también está dentro del ZIP, en Maestros)."},
    ],
    "pasos": [
        {"titulo": "1. Aclarar el encargo y preparar las carpetas",
         "md": "Manda tus preguntas y apunta las respuestas en una hoja **Léame**. Descomprime el ZIP y deja en `ERP` **solo** las exportaciones del ERP. Guarda tu libro en `Informe` como `P5_Informe_ventas_2026-10_v01.xlsx`.",
         "pista": "Power Query, al leer una carpeta, se trae todo lo que hay dentro y en sus subcarpetas. Mira qué hay en `ERP` antes de conectar: ¿hay algún archivo que no sea una exportación mensual?"},
        {"titulo": "2. Perfilar los datos antes de construir",
         "md": "Abre cada CSV con el Bloc de notas (no con doble clic en Excel, que los cambia al guardarlos). Anota en una hoja **Calidad_datos**: separador, encabezados, nº de columnas y cualquier rareza. Mira los maestros.",
         "pista": "Fíjate en la primera línea de cada archivo: ¿empiezan todos por «Fecha»? ¿Usan todos «;»? ¿Tienen todos 12 columnas? Compara marzo, mayo, julio y agosto con enero."},
        {"titulo": "3. Conectar la carpeta con Power Query",
         "md": "**Datos > Obtener datos > Del archivo > De la carpeta**, elige `ERP`, **Transformar datos** y **Combinar archivos**. Filtra para que solo entren los archivos `ventas_AAAA_MM.csv`.",
         "pista": "En el cuadro **Combinar archivos**, en «Archivo de ejemplo», elige el último mes (octubre). Si el ejemplo es enero, Power Query fija 12 columnas y la columna nueva de julio se pierde. Origen del archivo: 65001: Unicode (UTF-8); delimitador: punto y coma."},
        {"titulo": "4. Cuadrar cada mes con el ERP",
         "md": "Antes de limpiar nada, carga una tabla dinámica de prueba (o agrupa en Power Query) por **Source.Name** con el nº de líneas y la suma de ImporteNeto, y compárala con **Control_ERP**. Los meses que no cuadren son tu lista de problemas.",
         "pista": "Si un mes sale con todo en una columna, el separador es otro: haz una consulta aparte para ese archivo con su delimitador y su configuración regional y añádela con **Inicio > Anexar consultas**. Si un mes trae una línea de título, en su consulta: **Quitar filas > Quitar filas superiores** y **Usar la primera fila como encabezado**. Lo más profesional es, además, pedir al ERP que los vuelva a exportar."},
        {"titulo": "5. Tipos con configuración regional y limpieza",
         "md": "Pon los tipos con **Cambiar tipo > Usar configuración regional** (Español (España); Inglés (Estados Unidos) para el archivo que venga «a la americana»). Deja una sola grafía por delegación y CodProducto siempre con 6 dígitos.",
         "pista": "Delegacion: **Recortar**, **MAYÚSCULAS** y **Combinar consultas** con una tabla `MapaDelegaciones` (Original → Delegacion). CodProducto: tipo Texto y una columna personalizada con `Text.PadStart(Text.From([CodProducto]), 6, \"0\")` (es la única línea de M que tienes que escribir)."},
        {"titulo": "6. Cruzar con los maestros",
         "md": "**Combinar consultas** Ventas × Productos (Externa izquierda) para traer Familia, Subfamilia y CosteEstandar, y Ventas × Comerciales. Saca la lista de códigos que no están en Productos y ponles la familia «Sin clasificar».",
         "pista": "La lista sale con **Combinar consultas** y tipo de combinación **Anti izquierda** (filas solo de la primera tabla) y **Quitar duplicados** de CodProducto. Para la familia vacía: **Reemplazar valores** null por «Sin clasificar»."},
        {"titulo": "7. Coste y margen",
         "md": "Crea el coste de cada línea con la regla pactada y el margen. Comprueba el margen de toda la empresa y el de cada comercial (sin «Ajustes»).",
         "pista": "**Agregar columna > Columna condicional**: si CosteUnitario es igual a null, CosteEstandar; si no, CosteUnitario. Después Coste = ese valor × Cantidad, y Margen = ImporteNeto − Coste. El margen % de un grupo es Σ margen / Σ ventas, nunca la media de los porcentajes."},
        {"titulo": "8. Objetivos y 2025 en formato largo",
         "md": "Pasa Objetivos_2026 y Ventas_2025_resumen a una fila por mes y monta una tabla **Comparacion** que junte lo real de 2026, lo real de 2025 y los objetivos.",
         "pista": "Selecciona las columnas que NO son meses > **Transformar > Anular dinamización de otras columnas**. Convierte «Ene…Dic» en nº de mes con una tabla `Meses` y Combinar consultas. Luego **Anexar consultas**: 2026 agrupado (Tipo = Real, Año = 2026) + 2025 (Tipo = Real, Año = 2025) + objetivos (Tipo = Objetivo). Cuidado con «Lérida»."},
        {"titulo": "9. Tablas dinámicas",
         "md": "Cuatro tablas dinámicas: (a) delegación y mes, 2026 frente a 2025 con % de diferencia; (b) comercial, real frente a objetivo y % de cumplimiento; (c) familia con margen % como **campo calculado**; (d) top 20 clientes con % acumulado (Pareto).",
         "pista": "(a) Columnas = Año; segunda copia del valor con **Mostrar valores como > % de diferencia de**, campo base Año, elemento 2025. (c) **Analizar tabla dinámica > Campos, elementos y conjuntos > Campo calculado**. (d) Filtro de valor **Diez mejores** = 20 y **Mostrar valores como > % del total acumulado en**."},
        {"titulo": "10. Segmentaciones, gráficos y minigráficos",
         "md": "Segmentaciones de Delegación y Familia que filtren **todas** las tablas dinámicas, escala de tiempo por mes, un gráfico combinado (2026 y 2025 en columnas y el % de variación en línea), barras de cumplimiento con la línea del 100 % y minigráficos de 10 meses por comercial.",
         "pista": "Clic derecho en la segmentación > **Conexiones de informe** y marca todas las tablas dinámicas. En el gráfico combinado, la serie de % va en el **eje secundario** (Cambiar tipo de gráfico > Cuadro combinado). Minigráficos: **Insertar > Minigráficos > Línea**."},
        {"titulo": "11. Dos salidas y título dinámico",
         "md": "Hoja **Informe_Reunion** sin ningún margen y hoja **Informe_Direccion** completa, cada una en una página, con un título que cambie solo con el mes. Exporta «Reunión» a PDF.",
         "pista": "Título: `=\"Ventas acumuladas a \"&TEXTO(MAX(Ventas[Fecha]);\"mmmm\")&\" de \"&AÑO(MAX(Ventas[Fecha]))`. Opcional: una macro grabada «ExportarReunion» (Actualizar todo + exportar PDF) en un .xlsm con un botón."},
        {"titulo": "12. Controles y Léame",
         "md": "Hoja **Controles**: cada mes contra Control_ERP (diferencia 0 y 0,00 €), Σ por delegación, por familia y por comercial + Ajustes = total, delegaciones sin mapa = 0, huérfanos listados, y un **control maestro** `=Y(...)` en verde que se repita en los informes. En el **Léame**, «Cómo hacer el informe de noviembre» paso a paso.",
         "pista": "Usa SUMAR.SI.CONJUNTO y CONTAR.SI.CONJUNTO por archivo o por mes contra la tabla de Control_ERP. Si pides a Copilot (o al asistente autorizado por la empresa) que te explique la consulta M, compruébalo en el editor y anótalo en el Léame; no pegues datos de clientes en herramientas no autorizadas."},
        {"titulo": "13. Entregar",
         "md": "PDF de «Reunión», libro final y correo a Javier con 3 conclusiones con cifra, los límites de los datos y los riesgos. Comprueba que las cifras del correo son las del libro.",
         "pista": "Una conclusión por delegación, otra por comerciales (objetivo y margen) y otra por familias o clientes. Di lo que no se puede saber (2025 por comercial) y qué propones vigilar."},
        {"titulo": "14. Cambio inesperado (diciembre): llega noviembre",
         "md": "Javier te escribe en diciembre:\n\n> Hola: te he dejado en `Llega_en_diciembre` el archivo de noviembre. En noviembre hemos abierto **Logroño**: los clientes de La Rioja ya los llevan Marina Sáenz (V13) y Rubén Ibáñez (V14), que acaban de entrar. Compras y RR. HH. han dejado sus altas y las de los productos nuevos en `altas_diciembre.xlsx`. ¿Me lo tienes para el lunes? Javier\n\nCopia el CSV en `ERP`, actualiza y resuélvelo **en menos de 30 minutos**, sin rehacer nada. Enero-octubre no deben cambiar.",
         "pista": "La actualización falla porque una columna ha cambiado de nombre: abre el CSV y compáralo con los anteriores. Añade un paso de renombrado tolerante en la consulta de función (`Table.RenameColumns(…, MissingField.Ignore)`), la delegación nueva al mapa, los comerciales nuevos y los productos nuevos a sus maestros. Avisa a Javier de que Logroño no tiene comparación con 2025 ni objetivo, y anótalo en el registro de cambios."},
    ],
    "controles": [
        {"pregunta": "Ventas netas de la empresa de enero a octubre de 2026 (€)", "respuesta": C["ventas_total"], "tolerancia": 0.01,
         "pista": "Debe ser igual a la suma de ImporteNeto de Control_ERP. Si te sale de menos, revisa marzo y mayo; si te sale de más, mira qué archivos hay en la carpeta ERP."},
        {"pregunta": "Ventas netas de la delegación de Lleida, enero-octubre (€)", "respuesta": C["ventas_lleida"], "tolerancia": 0.01,
         "pista": "Lleida no siempre se escribe igual en el ERP (y a veces lleva un espacio al final). Recorta, pasa a mayúsculas y usa la tabla de equivalencias."},
        {"pregunta": "Venta neta de los productos «Sin clasificar» (códigos que no están en el maestro), enero-octubre (€)", "respuesta": C["sin_clasificar"], "tolerancia": 0.01,
         "pista": "Si te sale cerca de " + eur(C["sin_clasificar"] + A["agosto_sin_ceros"], 0) + ", agosto ha perdido los ceros a la izquierda de CodProducto: rellénalos hasta 6 dígitos antes de combinar con Productos."},
        {"pregunta": "¿Cuántos códigos de producto distintos no están en el maestro de productos?", "respuesta": C["huerfanos"], "tolerancia": 0,
         "pista": "Combinar consultas Ventas × Productos con «Anti izquierda» y quitar duplicados de CodProducto. Si salen cientos, revisa el código de agosto."},
        {"pregunta": "Margen bruto total de la empresa, enero-octubre (€)", "respuesta": C["margen_total"], "tolerancia": 1,
         "pista": "Coste = (CosteUnitario si la línea lo trae; si no, CosteEstandar) × Cantidad, sin redondear línea a línea (redondeando, la diferencia es de 1 € como mucho). Si usas solo el coste estándar te sale " + eur(A["margen_solo_estandar"] - C["margen_total"], 0) + " de más."},
        {"pregunta": "¿Cuántos comerciales tienen un margen bruto inferior al 22 % (sin «Ajustes»)?", "respuesta": C["comerciales_margen_bajo"], "tolerancia": 0,
         "pista": "Margen % de cada comercial = Σ margen / Σ ventas de sus líneas. Con el coste estándar en todo el año, uno de los dos se escapa por encima del 22 %."},
        {"pregunta": "Variación de las 6 familias de producto, enero-octubre de 2026 frente al mismo periodo de 2025 (%, con un decimal)", "respuesta": C["var_6fam_pct"], "tolerancia": 0.1,
         "pista": "2025 solo trae las 6 familias de producto: deja fuera «Portes y servicios», «Ajustes» y «Sin clasificar», y suma 2025 solo de enero a octubre."},
        {"pregunta": "Cumplimiento del objetivo de la delegación de Pamplona, enero-octubre (%, con un decimal)", "respuesta": C["cumpl_pamplona_pct"], "tolerancia": 0.1,
         "pista": "Ventas de Pamplona sin «Ajustes» / suma de los objetivos de enero a octubre de sus 3 comerciales (V07, V08 y V09). En el ERP, Pamplona sale como «Pamplona/Iruña»."},
    ],
    "entregables": [
        "Libro P5_Informe_ventas_2026-10_v01.xlsx (en la carpeta Informe) con Léame, Parámetros, consultas de Power Query, Calidad_datos, tablas, Informe_Reunion, Informe_Direccion y Controles con el control maestro en verde.",
        "PDF de la salida «Reunión» (sin márgenes), en una página, para el 25/11/2026.",
        "Lista de los códigos de producto sin alta para Compras.",
        "Correo de entrega a Javier con 3 conclusiones con cifra, supuestos, límites de los datos y cómo actualizar.",
        "Tras el cambio de diciembre: el libro con noviembre añadido sin rehacer nada y el registro de cambios al día.",
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: no cuadra con el ERP, o marzo y mayo están mal sin que se vea.",
            "Aceptable: cuadra en total, pero el margen usa un solo coste o las devoluciones suman.",
            "Bien: cuadran los 10 meses; margen con el coste correcto en cada periodo; huérfanos tratados.",
            "Excelente: además, explica con cifras el efecto del cambio de coste en julio y el peso del pronto pago, y documenta los problemas sembrados (incluida la copia de septiembre).",
        ]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: copias pegadas de cada mes.",
            "Aceptable: Power Query, pero con pasos frágiles (por posición de columna) o con los maestros pegados como valores.",
            "Bien: consultas por nombre de columna, maestros y mapas en tablas, hecho de comparación anexado, parámetros con nombre.",
            "Excelente: además, consultas con nombres claros, agrupadas y documentadas en el Léame, y la columna original de delegación conservada para auditar.",
        ]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: cada mes hay que hacerlo a mano.",
            "Aceptable: hay que tocar las consultas cada mes.",
            "Bien: copiar el CSV, Actualizar todo y los controles en verde.",
            "Excelente: además, el cambio de noviembre se resuelve en menos de 30 minutos, enero-octubre no cambian y queda anotado en el registro de cambios.",
        ]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: tablas dinámicas en crudo.",
            "Aceptable: gráficos sin jerarquía, en 3D o con el % en el eje principal.",
            "Bien: dos salidas limpias de una página, gráfico combinado, minigráficos y segmentaciones conectadas.",
            "Excelente: además, títulos dinámicos, «Controles: OK» en la cabecera, una página por audiencia y gráficos con texto alternativo.",
        ]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: sin conclusiones o sin preguntar nada antes de empezar.",
            "Aceptable: describe los datos («Lleida sube») sin cifra ni causa.",
            "Bien: 3 conclusiones con cifra y causa probable; supuestos claros.",
            "Excelente: además, separa lo que sabe de lo que no (no hay 2025 por comercial), propone vigilar a los 2 comerciales con margen bajo y adapta el mensaje (Reunión sin márgenes).",
        ]},
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas el informe a Javier (máximo 15 líneas).",
        "modelo": (
            "Asunto: Informe de ventas enero-octubre 2026 (listo para el 25)\n\n"
            "Hola, Javier:\n\n"
            "Te dejo en Ventas\\Informe el libro P5_Informe_ventas_2026-10_v01.xlsx y el PDF de la reunión (sin márgenes). Los 10 meses cuadran con el ERP al céntimo.\n\n"
            f"1. Vamos a {eur(C['ventas_total'], 0)} de venta neta, un {pct(C['var_6fam_pct'])} más que en 2025 en las familias de producto. "
            f"Lleida es la que más crece ({pct(D['Lleida']['var'])}); Pamplona, la que menos ({pct(D['Pamplona']['var'])}).\n"
            f"2. Pamplona está al {pct(C['cumpl_pamplona_pct'])} de su objetivo (Zaragoza, {pct(A['cumpl_deleg']['Zaragoza'])}; Lleida, {pct(A['cumpl_deleg']['Lleida'])}).\n"
            f"3. Margen bruto del {pct(A['margen_pct'])}. {COM[b1]['nombre'].split()[0]} ({pct(COM[b1]['margen_pct'])}) y {COM[b2]['nombre'].split()[0]} ({pct(COM[b2]['margen_pct'])}) están por debajo del 22 %: propongo revisar con ellos los descuentos. "
            f"Desde julio el coste real de la línea es más alto que el estándar (sobre todo en cable): {eur(A['efecto_coste_julio'], 0)} menos de margen de julio a octubre.\n\n"
            f"Límites: 2025 solo tiene detalle por delegación y familia, así que por comercial solo comparo con el objetivo. Hay 7 códigos que no están en el maestro ({eur(C['sin_clasificar'], 0)}): te paso la lista para Compras. "
            "Marzo y mayo llegaron con otro formato; ya están bien, pero convendría pedir al ERP que no se repita.\n\n"
            "Para noviembre: copiar el CSV en la carpeta ERP, Datos > Actualizar todo y mirar que la hoja Controles esté en verde. Lo tienes en el Léame.\n\n"
            "Un saludo."
        ),
        "criterios": [
            "Las cifras coinciden con las del libro (ventas, variación, cumplimiento, margen).",
            "Da 3 conclusiones con cifra y causa probable o propuesta de acción.",
            "Dice los límites de los datos: 2025 sin detalle por comercial, códigos sin clasificar, archivos que llegaron mal.",
            "Explica cómo se actualiza el mes siguiente.",
            "Es breve, va al grano y no adjunta márgenes en la versión para todo el equipo.",
        ],
    },
    "archivo_solucion": "p5-solucion.xlsx",
}

S = []
S.append("### La idea\n"
         "Power Query lee la carpeta del ERP, limpia y cruza con los maestros; las tablas dinámicas y los gráficos salen de esas tablas; la hoja **Controles** dice si todo cuadra. "
         "El mes siguiente solo hay que copiar el CSV y pulsar **Datos > Actualizar todo** ([[Ctrl]]+[[Alt]]+[[F5]]). El libro resuelto (`p5-solucion.xlsx`) trae las tablas que cargan las consultas, "
         "los informes hechos con fórmulas para que veas las cifras, la hoja **Controles** y la hoja **Cómo se hizo** con cada paso de Power Query y de las tablas dinámicas.")
S.append("### 1. Lo que había en los datos (hoja Calidad_datos)\n"
         "| Problema | Archivo | Cómo se ve | Qué se hizo |\n|---|---|---|---|\n"
         "| Copia de septiembre en la carpeta | `ventas_2026_09 - copia.csv` | Septiembre con el doble de líneas | Sacarla de la carpeta y filtrar los nombres `ventas_AAAA_MM.csv` |\n"
         f"| Separador «,», punto decimal y fechas M/D/AAAA | marzo | Todo en una columna; el cuadre de marzo da 0 € (o importes ×100 con Español) | Consulta aparte con «,» e Inglés (Estados Unidos), y Anexar |\n"
         "| Línea de título antes de los encabezados | mayo | Encabezados «Column1…» y mayo vacío | Quitar filas superiores (1) y Usar la primera fila como encabezado |\n"
         "| Columna nueva CosteUnitario | julio a octubre | 13 columnas en vez de 12 | Archivo de ejemplo = octubre; Power Query casa por nombre y deja null antes de julio |\n"
         "| CodProducto sin ceros | agosto (se abrió y guardó en Excel) | «14821» en vez de «014821»; todo agosto «Sin clasificar» | Texto y `Text.PadStart(Text.From([CodProducto]), 6, \"0\")` |\n"
         f"| Delegación en 6 grafías y con espacios | todos | Zaragoza, ZARAGOZA, Zgz, Pamplona/Iruña, Lleida, Lérida | Recortar, MAYÚSCULAS y MapaDelegaciones ({es(A['lineas_delegacion_mal_escrita'], 0)} líneas no estaban escritas con el nombre oficial) |\n"
         f"| Devoluciones | todos | {A['n_devoluciones']} líneas con Cantidad negativa ({eur(A['devoluciones'])}) | Se dejan: restan en ventas y en margen |\n"
         f"| 7 códigos sin alta en Productos | julio-octubre | Familia vacía al combinar | «Sin clasificar» ({eur(C['sin_clasificar'])}) y lista para Compras |\n"
         f"| Pronto pago como línea | todos | DTO. PRONTO PAGO, negativo y sin albarán | Familia «Ajustes» ({eur(A['ajustes'])}): en la empresa sí, en los comerciales no |\n\n"
         "Hay además 2 líneas idénticas en un mismo albarán que **son legítimas** (el mismo artículo pedido dos veces): el cuadre con Control_ERP lo demuestra. Por eso no se usa Quitar duplicados en las ventas.")
S.append("### 2. Conectar y cuadrar\n"
         "1. **Datos > Obtener datos > Del archivo > De la carpeta** > `Ventas\\ERP` > **Transformar datos** > **Combinar archivos**, con `ventas_2026_10.csv` como archivo de ejemplo.\n"
         "2. Filtro en Name: comienza por «ventas_» y no contiene espacios (fuera la copia).\n"
         "3. Marzo y mayo, en consultas aparte, se añaden con **Inicio > Anexar consultas**.\n"
         "4. Agrupar por Source.Name (nº de filas y suma de ImporteNeto) y comparar con Control_ERP: **10 de 10 meses con diferencia 0 y 0,00 €**.\n\n"
         "| Mes | Líneas | ImporteNeto |\n|---|---|---|\n" +
         "\n".join(f"| {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre'][m - 1]} | {es(n, 0)} | {eur(s_)} |"
                   for m, (n, s_) in sorted(((int(k), tuple(v)) for k, v in json.load(open(os.path.join(AQUI, 'p5_verdad.json'), encoding='utf-8'))['por_mes'].items()))) +
         f"\n| **Total** | **{es(C['lineas'], 0)}** | **{eur(C['ventas_total'])}** |")
S.append("### 3. Tipos, limpieza y maestros\n"
         "- Tipos con **Cambiar tipo > Usar configuración regional**: Español (España) en la consulta principal y en mayo; Inglés (Estados Unidos) en marzo. CodProducto, siempre Texto.\n"
         "- Delegacion: Recortar + MAYÚSCULAS + Combinar consultas con `MapaDelegaciones`. Se guarda la original como DelegacionERP.\n"
         "- Combinar con Productos (Externa izquierda) y con Comerciales. Huérfanos con **Anti izquierda**: 7 códigos, todos dados de alta en el ERP desde julio.\n"
         "- Columna condicional: si CosteUnitario es null, CosteEstandar; si no, CosteUnitario. Coste = × Cantidad; Margen = ImporteNeto − Coste. CuentaComercial = «No» en Ajustes.")
S.append("### 4. Objetivos, 2025 y la tabla Comparacion\n"
         "Anular dinamización de otras columnas en Objetivos_2026 y Ventas_2025_resumen, nº de mes con la tabla `Meses`, «Lérida» por el mapa. "
         "Después, **Anexar consultas**: ventas de 2026 agrupadas por Delegacion, Familia, CodComercial y Mes (Tipo Real, Año 2026) + 2025 (Tipo Real, Año 2025) + objetivos (Tipo Objetivo). "
         "Columna Comparable = «Sí» en las 6 familias de producto. Con esa única tabla, una tabla dinámica compara años y otra compara con el objetivo.")
S.append("### 5. Tablas dinámicas y fórmulas equivalentes\n"
         "- (a) Delegación × Mes, Año en columnas y **Mostrar valores como > % de diferencia de** (Año, 2025). Con fórmulas: `=SUMAR.SI.CONJUNTO(Comparacion[Importe];Comparacion[Año];2025;Comparacion[Delegacion];A10;Comparacion[NumMes];\"<=\"&MES(FechaCorte))`.\n"
         "- (b) Comercial: Real frente a Objetivo y cumplimiento `=SI.ERROR(D50/E50;\"\")` (en Informe_Direccion, fila del primer comercial).\n"
         "- (c) Familia con el **campo calculado** Margen % = Margen / ImporteNeto: opera sobre las sumas, así que da Σ margen / Σ ventas (la media de los porcentajes de los comerciales daría " + pct(A["media_pct_comerciales"]) + ", que no significa nada).\n"
         f"- (d) Top 20 clientes con % acumulado: los 20 primeros son el {pct(A['top20_pct'])} de la venta; hacen falta {A['n_clientes_80']} de {A['clientes_activos']} clientes para llegar al 80 %. Con fórmulas: `=K.ESIMO.MAYOR(Clientes[Ventas2026];A83)` y `=INDICE(Clientes[CodCliente];COINCIDIR(D83;Clientes[Ventas2026];0))`.\n"
         "- Segmentaciones de Delegación y Familia con **Conexiones de informe** a todas las tablas dinámicas; escala de tiempo por Mes.\n"
         "- Gráfico combinado con el % en el **eje secundario**; cumplimiento con línea del 100 %; minigráficos de 10 meses.")
S.append("### 6. Resultados (enero-octubre de 2026)\n"
         "| Delegación | Ventas netas | 6 familias 2026 | 2025 | Var. % | Cumplimiento | Margen % |\n|---|---|---|---|---|---|---|\n" +
         "\n".join(f"| {d} | {eur(D[d]['ventas'], 0)} | {eur(D[d]['ventas6'], 0)} | {eur(D[d]['v2025'], 0)} | {pct(D[d]['var'])} | {pct(A['cumpl_deleg'][d])} | {pct(D[d]['margen_pct'])} |" for d in ["Zaragoza", "Pamplona", "Lleida"]) +
         f"\n| **Total** | **{eur(C['ventas_total'], 0)}** | **{eur(A['ventas6_2026'], 0)}** | **{eur(A['ventas6_2025'], 0)}** | **{pct(C['var_6fam_pct'])}** | **{pct(A['cumpl_total'])}** | **{pct(A['margen_pct'])}** |\n\n"
         "| Familia | Ventas netas | Margen % | Var. frente a 2025 |\n|---|---|---|---|\n" +
         "\n".join(f"| {f} | {eur(FAM[f]['ventas'], 0)} | {pct(FAM[f]['margen_pct']) if f != 'Ajustes' else '—'} | {pct(FAM[f]['var']) if FAM[f]['var'] is not None else 'sin dato'} |" for f in FAM) +
         "\n\n| Comercial | Ventas (sin Ajustes) | Objetivo | Cumplimiento | Margen % |\n|---|---|---|---|---|\n" +
         "\n".join(f"| {c} {COM[c]['nombre']} | {eur(COM[c]['ventas'], 0)} | {eur(COM[c]['objetivo'], 0)} | {pct(COM[c]['cumpl'])} | {pct(COM[c]['margen_pct'])} |" for c in COM))
S.append("### 7. Controles (hoja Controles)\n"
         "Cada mes contra Control_ERP (líneas e importe), Σ por delegación = Σ por familia = Σ por comercial + Ajustes = total, delegaciones sin mapa = 0, comerciales sin maestro = 0, "
         "líneas «Sin clasificar» = líneas de la lista de huérfanos, líneas sin coste = 0, margen = ventas − coste y fechas dentro del periodo. "
         "Control maestro: `=Y(G6:G18;I24:I34)` con formato condicional verde o rojo, repetido arriba de cada informe con `=\"Controles: \"&SI(Controles!C3;\"OK\";\"REVISAR\")`.")
S.append("### 8. Lo que hay que contar a Javier\n"
         f"- **El coste de julio**: de enero a junio el margen es del {pct(A['margen_pct_ene_jun'])}; de julio a octubre, con el coste real de la línea, del {pct(A['margen_pct_jul_oct'])} "
         f"(con el estándar habría salido {pct(A['margen_pct_jul_oct_estandar'])}). El coste real está {eur(A['efecto_coste_julio'], 0)} por encima del estándar, sobre todo en cable (margen del {pct(FAM['Cable']['margen_pct'])}): conviene actualizar los costes estándar del maestro.\n"
         f"- **Pronto pago**: {eur(A['ajustes'])}; no es mucho, pero si se cargara a los comerciales les bajaría las ventas.\n"
         f"- **Margen bajo**: {COM[b1]['nombre']} ({pct(COM[b1]['margen_pct'])}) y {COM[b2]['nombre']} ({pct(COM[b2]['margen_pct'])}).\n"
         "- **Límites**: no hay 2025 por comercial ni de portes, ajustes o productos sin clasificar.")
S.append("### 9. El cambio de diciembre\n"
         "1. Al actualizar con `ventas_2026_11.csv` falla: la columna se llama «Importe Neto». En la consulta de función, después de promover encabezados: "
         "`Table.RenameColumns(#\"Encabezados promovidos\", {{\"Importe Neto\", \"ImporteNeto\"}}, MissingField.Ignore)`. Así también funcionan los meses que ya venían bien.\n"
         "2. El control de delegación sin mapa salta: «LOGROÑO» → Logroño en MapaDelegaciones. Altas de V13 y V14 en Comerciales (sin objetivo todavía) y de los 7 productos en Productos: «Sin clasificar» pasa a 0,00 €.\n"
         f"3. Noviembre: {es(N['lineas'], 0)} líneas y {eur(N['ventas'])}, de ellos Logroño {eur(N['logrono'])}. Enero-octubre siguen dando {eur(C['ventas_total'])}.\n"
         "4. Aviso a Javier: Logroño no tiene comparación con 2025 ni objetivo; registro de cambios v02 en el Léame.")
proyecto["solucion_md"] = "\n\n".join(S)

proyecto["errores_tipicos"] = [
    "Combinar archivos con la carpeta llena de otras cosas: la copia de septiembre entra y septiembre cuenta el doble.",
    "Dejar enero como «Archivo de ejemplo»: Power Query fija 12 columnas y CosteUnitario desaparece en julio-octubre.",
    "Pasos por posición de columna (Columna1, Columna2…) que se rompen cuando cambia el esquema.",
    "Tipos sin configuración regional: fechas de marzo mal leídas e importes multiplicados por 100.",
    "Convertir CodProducto en número: se pierden los ceros y nada casa con el maestro.",
    "Quitar duplicados en las ventas: hay líneas idénticas que son legítimas y el cuadre con el ERP deja de dar 0.",
    "Media de los márgenes % de los comerciales en lugar de Σ margen / Σ ventas.",
    "Comparar con 2025 por comercial o con el total de la empresa, cuando 2025 solo trae las 6 familias por delegación.",
    "Contar el pronto pago en las ventas de los comerciales.",
    "Repartir el informe con márgenes a todo el equipo.",
    "No conectar las segmentaciones a todas las tablas dinámicas.",
    "Gráfico combinado con el % en el eje principal (la línea queda pegada al cero).",
    "Abrir los CSV con doble clic y guardarlos desde Excel: se pierden ceros y decimales (lo que le pasó a agosto).",
]
proyecto["ampliaciones"] = [
    "Modelo de datos con relaciones Ventas → Productos, Clientes y Calendario en lugar de combinaciones (puente hacia el cuadro de mando de P8).",
    "Gráfico de proyección solar Familia > Subfamilia.",
    "AGRUPARPOR o PIVOTARPOR (solo Microsoft 365) como informe con fórmulas frente a la tabla dinámica.",
    "Una única función de Power Query que detecte sola el separador y la línea de título, para no tener consultas aparte.",
    "Comisiones por tramos de cumplimiento para cada comercial.",
]

# orden de las claves como en GUIA-AUTORES §7
orden = ["id", "titulo", "departamento", "nivel_requerido", "horas", "resumen", "habilidades", "correo", "preguntas_previas",
         "aclaraciones", "datos_md", "archivos", "pasos", "controles", "entregables", "rubrica", "correo_entrega",
         "solucion_md", "archivo_solucion", "errores_tipicos", "ampliaciones"]
salida = {k: proyecto[k] for k in orden}
os.makedirs(os.path.join(EXCEL, "proyectos"), exist_ok=True)
with open(os.path.join(EXCEL, "proyectos", "p5.json"), "w", encoding="utf-8") as fh:
    json.dump(salida, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
with open(os.path.join(LIBROS, "p5-solucion.meta.json"), "w", encoding="utf-8") as fh:
    json.dump({"titulo": "P5 · Informe mensual de ventas: solución",
               "descripcion": "Libro resuelto: tablas que cargan las consultas, informes de Reunión y Dirección, controles y los pasos de Power Query y de las tablas dinámicas.",
               "nivel": "n6"}, fh, ensure_ascii=False, indent=2)
print("proyectos/p5.json escrito.", len(json.dumps(salida, ensure_ascii=False)), "caracteres")
