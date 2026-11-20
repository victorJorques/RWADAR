# -*- coding: utf-8 -*-
"""P7 · genera proyectos/p7.json y los .meta.json con las cifras de src/p7-controles.json (pandas, desde los datos).
Uso: python3 p7_proyecto.py  (después de p7_datos.py y p7_solucion.py)"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
LIBROS = os.path.dirname(AQUI)
EXCEL = os.path.dirname(LIBROS)
C = json.load(open(os.path.join(AQUI, "p7-controles.json"), encoding="utf-8"))
X = C["extra"]


def e(x, d=0):
    s = f"{abs(x):,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if x < 0 else "") + s


def pc(x, d=1):
    return e(x * 100, d) + " %"


ctrl = {i: c["respuesta"] for i, c in enumerate(C["controles"])}
VENTAS, RES, OTROS, SINAS, EBITDA, NIMP, PREV = ctrl[1], ctrl[2], ctrl[3], ctrl[4], ctrl[5], ctrl[6], ctrl[7]
EBP = X["ebitda_ppto_acum"]
casc = dict(X["cascada"])
esc = X["escenarios"]
bo = X["buscar_objetivo"]
pa = X["paco"]
ef = pa["efectos"]
c18 = X["cambio_18nov"]
imp = {(r["Partida"], r["Departamento"]): r for r in X["importan"]}
mpr, mpp = X["margen_pct_real"], X["margen_pct_ppto"]
d_ventas = VENTAS - X["ventas_ppto_acum"]
pres_res, ok_res = pa["presentado"]["Resultado"], pa["correcto"]["Resultado"]

proy = {
    "id": "p7",
    "titulo": "Presupuesto frente a real y previsión de cierre",
    "departamento": "Administración y finanzas (control de gestión)",
    "nivel_requerido": "n5",
    "horas": 11,
    "resumen": "Audita el libro heredado de Paco, pasa a formato largo un presupuesto hecho en cinco pestañas distintas, "
               "cruza el diario contable con un mapeo con excepciones y entrega al consejo, en una página, las desviaciones "
               "que importan, la cascada del EBITDA y una previsión de cierre con escenarios.",
    "habilidades": ["Auditoría de fórmulas", "Ir a Especial", "Opciones para el cálculo", "Vínculos de libro",
                    "Power Query: anular dinamización y anexar", "Configuración regional", "BUSCARX con SI.ND",
                    "Trampa de tipos texto/número", "SUMAR.SI.CONJUNTO", "Signo según ingreso o gasto",
                    "Desviación con umbral doble", "Diferencias temporales", "Previsión de cierre",
                    "Administrador de escenarios", "Buscar objetivo", "PAGOINT y PAGO.INT.ENTRE", "Gráfico de cascada",
                    "FILTRAR y ORDENARPOR", "Formatos personalizados", "LAMBDA con nombre (opcional)", "Controles"],
    "correo": {
        "de": "Marta Ruiz (Directora financiera)",
        "para": "ti",
        "asunto": "Control presupuestario octubre (consejo del 20)",
        "cuerpo": "Hola:\n\nNecesito el presupuesto contra real de enero a octubre por departamento, con las desviaciones "
                  "que importan explicadas, y una previsión de cómo vamos a cerrar el año.\n\nTe paso el presupuesto que "
                  "aprobó el consejo (cada departamento hizo su pestaña) y el extracto de contabilidad. También el archivo "
                  "que usaba Paco el año pasado, por si te sirve, aunque no me fío mucho de él.\n\nLo presento el 20: tiene "
                  "que caber en una página.\n\nMarta\n\n(lunes 09/11/2026)",
    },
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel: ¿qué le preguntarías a Marta? Escribe el correo con tus preguntas (de 5 a 8, concretas).",
        "modelo": "Hola, Marta:\n\nAntes de empezar, para que el informe sea el que necesitas el 20:\n"
                  "1. «Las desviaciones que importan»: ¿del mes o acumuladas de enero a octubre? ¿A partir de qué % y de qué "
                  "importe?\n2. Signo: ¿desviación = real − presupuesto? ¿Marco favorable o desfavorable según sea ingreso o gasto?\n"
                  "3. Detalle: ¿por partida del informe y departamento, o por cuenta?\n4. Previsión de cierre: ¿real hasta octubre "
                  "más el presupuesto de noviembre y diciembre? ¿Qué escenarios quieres ver? ¿Cuento ya los gastos de Logroño?\n"
                  "5. Hay gastos que se contabilizan de golpe (el seguro en enero, la amortización por trimestres): ¿los ajusto o "
                  "solo los señalo?\n6. Si aparecen cuentas que no están en el mapeo, ¿dónde las pongo?\n7. La pestaña de "
                  "Dirección solo trae el total del año: ¿lo reparto en doceavas o con otra pauta?\n8. ¿Arreglo el archivo de "
                  "Paco o empiezo de cero? ¿Quieres saber si el resultado de 2025 que presentó era correcto?\n\nGracias,",
        "criterios": ["Pregunta si las desviaciones son del mes o acumuladas y pide un umbral en % y en €",
                      "Aclara el signo y el criterio de favorable o desfavorable en ingresos y gastos",
                      "Pide el método de la previsión de cierre y los escenarios (incluido Logroño)",
                      "Detecta las partidas que se contabilizan de golpe (seguro, amortización) y las cuentas sin mapeo",
                      "Pregunta qué hacer con el libro de Paco y con el total anual de Dirección"],
    },
    "aclaraciones": [
        {"pregunta": "¿Qué desviaciones «importan»? ¿Del mes o acumuladas?",
         "respuesta": "Acumuladas de enero a octubre. Importa si |desv.| ≥ 5 % y ≥ 3.000 €, las dos cosas a la vez. Las "
                      "partidas sin presupuesto, si pasan de 3.000 €."},
        {"pregunta": "¿Cómo presento el signo?",
         "respuesta": "Desviación = Real − Presupuesto. En gastos, positiva = desfavorable; en ingresos, negativa = "
                      "desfavorable. Columna F/D y color (el color sigue a F/D, no al signo)."},
        {"pregunta": "¿Con qué detalle?",
         "respuesta": "Partida del informe (según el mapeo) × departamento; el detalle por cuenta, en otra hoja. Ingresos y "
                      "Comercial son del departamento comercial (COM)."},
        {"pregunta": "¿Cómo hago la previsión de cierre?",
         "respuesta": "Base: real de enero a octubre + presupuesto de noviembre y diciembre. Escenarios: ventas de noviembre "
                      "y diciembre −8 %, 0 % y +4 % con el margen constante, y Logroño con +6.500 €/mes de gastos (abre en "
                      "noviembre). Financieros de noviembre y diciembre: intereses del préstamo de Banco Norte (85.000 € al "
                      "5 %, 48 cuotas; noviembre es la cuota 20) más 3.100 €/mes de la póliza de Banco Sur."},
        {"pregunta": "Hay gastos que se contabilizan de golpe: el seguro anual en enero y la amortización por trimestres.",
         "respuesta": "No se toca la contabilidad: se marcan como «diferencia temporal» y en la previsión se usa el importe "
                      "del año (seguro 14.400 €, amortización 96.000 €)."},
        {"pregunta": "Hay cuentas que no están en el mapeo (gastos de Logroño).",
         "respuesta": "Partida nueva «Apertura Logroño», fuera de presupuesto."},
        {"pregunta": "La pestaña de Dirección solo tiene el total anual.", "respuesta": "Se reparte en doceavas partes."},
        {"pregunta": "Hay apuntes sin centro de coste.",
         "respuesta": "Usa la tabla Reparto_por_cuenta; si la cuenta no está, van a «Sin asignar» y lo dices en el informe."},
        {"pregunta": "¿Arreglo el archivo de Paco o empiezo de cero?",
         "respuesta": "Lo que prefieras, pero dime qué estaba mal y si el resultado de 2025 que presentó era correcto."},
    ],
    "datos_md": "| Archivo | Qué es |\n|---|---|\n"
                "| `p7-datos.xlsx` | **Instrucciones**; el presupuesto 2026 en 5 pestañas tal como lo hizo cada departamento "
                "(**Ingresos, Comercial, Almacén y logística, Administración, Dirección**); **Mapeo_cuentas** (Cuenta3 → "
                "Partida, Tipo, Bloque) y **Reparto_por_cuenta** (centro de coste por defecto). |\n"
                "| `p7-diario-2026-ene-oct.csv` | El extracto de contabilidad de los grupos 6 y 7, de enero a octubre: unas "
                "7.600 líneas con Fecha, Asiento, Cuenta (8 dígitos), Concepto, CentroCoste, Debe y Haber. UTF-8, «;», "
                "coma decimal. |\n"
                "| `p7-control-2025-paco.xlsx` | El libro heredado de Paco Gil (control de 2025). Ábrelo sin actualizar "
                "vínculos. |\n"
                "| `p7-diario-2026-ene-oct-18nov.csv` | El mismo extracto exportado el 18/11. **No lo abras hasta el último "
                "paso.** |\n\n"
                "Lo que vas a encontrar (no está todo): pestañas con distinto número de filas de título y celdas combinadas, "
                "meses escritos de tres maneras, subtotales y filas TOTAL entre los datos, una pestaña con los números "
                "guardados como texto y otra que solo tiene el total del año. En el diario, gastos en el Haber e ingresos "
                "en el Debe, apuntes sin centro de coste, partidas que se contabilizan de golpe y una cuenta que el mapeo no "
                "conoce. Y una trampa de tipos: el mapeo guarda la cuenta de 3 dígitos como número. El libro de Paco tiene "
                "**8 errores** de los que se ven en las auditorías reales.",
    "archivos": [
        {"archivo": "p7-datos.xlsx", "titulo": "Presupuesto 2026 y mapeo",
         "descripcion": "Instrucciones, las 5 pestañas del presupuesto aprobado, Mapeo_cuentas y Reparto_por_cuenta."},
        {"archivo": "p7-diario-2026-ene-oct.csv", "titulo": "Diario de enero a octubre (CSV)",
         "descripcion": "Apuntes de los grupos 6 y 7 tal como salen de contabilidad (UTF-8, separador «;», coma decimal)."},
        {"archivo": "p7-control-2025-paco.xlsx", "titulo": "Libro heredado de Paco (2025)",
         "descripcion": "El control presupuestario de 2025 que se presentó al consejo. Para auditar, no para reutilizar."},
        {"archivo": "p7-diario-2026-ene-oct-18nov.csv", "titulo": "Diario reexportado el 18/11 (cambio inesperado)",
         "descripcion": "Solo para el último paso: la misma exportación con un apunte de octubre que faltaba."},
    ],
    "pasos": [
        {"titulo": "1. Aclarar el encargo y montar el Léame",
         "md": "Manda tus preguntas y apunta las respuestas en un **Léame** (objetivo, fecha de corte, supuestos, cómo "
               "actualizar). Crea **Parámetros** con nombre: mes de corte, los dos umbrales, el escenario de ventas, Logroño, "
               "la póliza y los datos del préstamo.",
         "pista": "Celdas de entrada en amarillo y con nombre (Fórmulas > Administrador de nombres). Nada de 5 % ni 3000 "
                  "dentro de las fórmulas."},
        {"titulo": "2. Auditar el libro de Paco (1 h)",
         "md": "Tabla con los 8 errores: dónde, qué pasa, cómo lo has encontrado y su efecto en el resultado de 2025. "
               "Conclusión: ¿era correcto el resultado presentado? Decide si reconstruyes.",
         "pista": "Antes de tocar nada, mira Fórmulas > Cálculo > Opciones para el cálculo y Datos > Consultas y conexiones > "
                  "Vínculos de libro. Luego Fórmulas > Mostrar fórmulas, Comprobación de errores, Rastrear precedentes, "
                  "Evaluar fórmula y Ventana Inspección; e Inicio > Buscar y seleccionar > Ir a Especial > Constantes."},
        {"titulo": "3. Presupuesto en formato largo (Power Query)",
         "md": "Una tabla **PptoLargo** (Pestaña, Departamento, Cuenta3, Mes 1-12, Importe) con las 5 pestañas anexadas, sin "
               "subtotales ni totales, y Dirección en doceavas. **Control:** ventas netas 9.480.000 €, gastos 9.173.000 €, "
               "resultado 307.000 €.",
         "pista": "En cada pestaña: quitar filas hasta la fila «Cuenta», usar la primera fila como encabezado, quedarse con "
                  "las filas de Cuenta numérica, **quitar la columna Total**, Anular dinamización de otras columnas "
                  "(Cuenta, Descripción) y pasar el mes a número con una tabla Meses. Administración: cambiar tipo con "
                  "configuración regional Español (España)."},
        {"titulo": "4. Real desde el diario",
         "md": "Importa el CSV a una Tabla **Diario** y añade Cuenta3, Mes, departamento (con la regla de Reparto_por_cuenta) "
               "e Importe con signo. **Control:** Σ Haber − Σ Debe = resultado real.",
         "pista": "Gasto = Debe − Haber; ingreso = Haber − Debe. IZQUIERDA devuelve texto: si el mapeo tiene números, "
                  "conviértelo con VALOR."},
        {"titulo": "5. Mapeo con excepciones",
         "md": "Partida, Tipo y Bloque de cada apunte. Las cuentas de 8 dígitos con trato especial van en una tabla "
               "**Excepciones** que se mira antes que el mapeo por 3 dígitos. **Control:** 0 apuntes sin partida.",
         "pista": "`=SI.ND(BUSCARX([@Cuenta];Excepciones[Cuenta];Excepciones[Partida]);BUSCARX(VALOR(IZQUIERDA([@Cuenta];3));"
                  "Mapeo[Cuenta3];Mapeo[Partida];\"SIN PARTIDA\"))`. Busca qué cuentas de 8 dígitos de la 629 no son "
                  "«otros servicios»."},
        {"titulo": "6. Informe de desviaciones",
         "md": "Partida × departamento: real y presupuesto acumulados, desviación en € y %, F/D, ¿importa?, naturaleza (real, "
               "temporal o fuera de presupuesto), presupuesto anual, previsión de cierre y desviación de cierre. Detalle por "
               "cuenta en otra hoja.",
         "pista": "SUMAR.SI.CONJUNTO con el mes ≤ Mes_corte. F/D con SI anidado según el Tipo. Importa con Y y ABS. Formato "
                  "`+#.##0 €;-#.##0 €;0 €` y el color por F/D con formato condicional."},
        {"titulo": "7. Diferencias temporales y previsión",
         "md": "Marca seguro y amortización como «temporal» y usa el importe del año en la previsión. Financieros de "
               "noviembre y diciembre con PAGOINT. **Control:** previsión de amortización 96.000 € y de seguro 14.400 €.",
         "pista": "No uses «real + presupuesto de nov-dic» en las temporales: el seguro saldría 16.800 € y la amortización "
                  "88.000 €. PAGOINT(5%/12;20;48;-85000) es la cuota de noviembre."},
        {"titulo": "8. Escenarios y Buscar objetivo",
         "md": "Administrador de escenarios (ventas nov-dic −8 %, 0 %, +4 %; Logroño sí o no) con su informe de resumen. "
               "Buscar objetivo: ¿cuánto hay que vender en noviembre y diciembre para llegar al EBITDA presupuestado "
               "(444.000 €)?",
         "pista": "Datos > Previsión > Análisis de hipótesis. Las celdas cambiantes tienen que ser entradas (Parámetros) y "
                  "la celda objetivo, una fórmula que dependa de ellas."},
        {"titulo": "9. Cascada y página para el consejo",
         "md": "Gráfico de cascada del EBITDA presupuestado acumulado al real (volumen, margen %, personal, otros gastos, "
               "Logroño y temporales). Una página A4 horizontal con 3 indicadores, la tabla de lo que importa, la cascada, "
               "4 comentarios de una línea, un índice con HIPERVINCULO y «Controles: TODO OK» en la cabecera.",
         "pista": "En el gráfico de cascada, la primera y la última columna son totales: botón derecho > Establecer como "
                  "total. La tabla de lo que importa puede salir sola con FILTRAR y ORDENARPOR."},
        {"titulo": "10. Controles, entrega y cambio inesperado",
         "md": "Hoja **Controles** con el control maestro en verde, correo a Marta y PDF. Después, el 18/11 llega el CSV "
               "reexportado: actualiza con él y di qué cambia en el informe y en los comentarios.",
         "pista": "Sustituye el CSV por el nuevo con el mismo nombre y pulsa Datos > Actualizar todo. Compara la tabla de lo "
                  "que importa antes y después."},
    ],
    "controles": [
        {"pregunta": C["controles"][0]["pregunta"], "respuesta": ctrl[0], "tolerancia": 0.01,
         "pista": "Si te sale el doble, no quitaste la columna Total antes de anular la dinamización; si te sale de menos, "
                  "mira Administración (texto) y Dirección (solo total anual)."},
        {"pregunta": C["controles"][1]["pregunta"], "respuesta": VENTAS, "tolerancia": 0.01,
         "pista": "Ventas netas = 700 + 708 con ingreso = Haber − Debe: las devoluciones del Debe restan."},
        {"pregunta": C["controles"][2]["pregunta"], "respuesta": RES, "tolerancia": 0.01,
         "pista": "Es la suma de la columna Haber menos la de Debe de todo el CSV. Tu informe tiene que dar lo mismo con "
                  "ingresos − gastos."},
        {"pregunta": C["controles"][3]["pregunta"], "respuesta": OTROS, "tolerancia": 0.01,
         "pista": "Si te sale 21.300 € de más, Logroño se ha escondido aquí (falta la excepción); si sale 18.000 € de más, "
                  "has sumado solo el Debe y te has comido la reclasificación de octubre."},
        {"pregunta": C["controles"][4]["pregunta"], "respuesta": SINAS, "tolerancia": 0.01,
         "pista": "Son los apuntes sin centro de coste cuya cuenta no está en Reparto_por_cuenta. Si te sale 0, ¿has dejado "
                  "los vacíos como texto vacío o como «Sin asignar»?"},
        {"pregunta": C["controles"][5]["pregunta"], "respuesta": EBITDA, "tolerancia": 0.01,
         "pista": "EBITDA = ventas netas − compras − personal − otros gastos de explotación (Logroño incluido). Sin "
                  "amortización ni intereses."},
        {"pregunta": C["controles"][6]["pregunta"], "respuesta": NIMP, "tolerancia": 0,
         "pista": "Las dos condiciones a la vez: |%| ≥ 5 Y |€| ≥ 3.000. El seguro (+20 %, pero 2.400 €) no entra; la "
                  "Seguridad Social de almacén (4.800 €, pero 3,9 %) tampoco."},
        {"pregunta": C["controles"][7]["pregunta"], "respuesta": PREV, "tolerancia": 0.01,
         "pista": "Real ene-oct + presupuesto nov-dic, salvo temporales (importe del año), financieros (PAGOINT + póliza) "
                  "y Logroño (13.000 € más)."},
    ],
    "entregables": [
        "Libro P7_Control_presupuestario_2026-10_v01.xlsx con Léame, Parámetros, PptoLargo y Diario (Power Query), Mapeo "
        "con Excepciones, Detalle, Detalle por cuenta, Escenarios, Cascada, Consejo, Auditoría de Paco, Calidad de datos y "
        "Controles con el control maestro en verde.",
        "PDF de la página del consejo (A4 horizontal, una sola página).",
        "Tabla de auditoría del libro de Paco con los 8 errores y la respuesta a «¿era correcto el resultado de 2025?».",
        "Correo de entrega a Marta y, el 18/11, un segundo correo con lo que cambia.",
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: mezcla signos (devoluciones o abonos que suman) o deja cuentas sin partida.",
            "Aceptable: cuadra en total, pero Logroño está escondido en «Otros servicios» o la trampa de tipos deja #N/D o "
            "ceros tapados con SI.ERROR.",
            "Bien: todos los controles cuadran; F/D correcto en ingresos y gastos; temporales identificados.",
            "Excelente: además, cuantifica el error de Paco en el resultado de 2025 y la previsión trata bien las partidas "
            "temporales."]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: copia el formato de Paco (meses en columnas, fórmulas a mano).",
            "Aceptable: hojas nuevas, pero con umbrales y signos dentro de las fórmulas.",
            "Bien: hechos largos de presupuesto y real, mapeo con excepciones y parámetros con nombre.",
            "Excelente: además, LAMBDA o LET documentadas, flujo de izquierda a derecha y detalle por cuenta enlazado."]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: cada mes hay que rehacerlo a mano.",
            "Aceptable: actualizar exige retocar el diario o copiar y pegar.",
            "Bien: se sustituye el CSV del diario, se pulsa Actualizar todo y los escenarios se recalculan; el cambio del "
            "18/11 se resuelve en menos de 30 minutos.",
            "Excelente: además, controles de tipo y de cuentas nuevas sin mapear, y registro de cambios."]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: una tabla de 60 partidas.",
            "Aceptable: una página, pero recargada o sin jerarquía.",
            "Bien: una página con indicadores, tabla de lo que importa, cascada y comentarios; formatos correctos.",
            "Excelente: además, accesible (F/D con letra, no solo color; texto alternativo en el gráfico) y lista para el "
            "consejo sin retoques."]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: manda una lista de desviaciones sin explicar.",
            "Aceptable: explica las cifras, no las causas.",
            "Bien: distingue entre desviaciones reales, temporales y fuera de presupuesto, con 4 comentarios útiles.",
            "Excelente: además, avisa del riesgo de cierre (escenario −8 %), de lo que haría falta vender en noviembre y "
            "diciembre para cumplir y de que el resultado de 2025 presentado no era correcto."]},
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas el control presupuestario a Marta (máximo 15 líneas).",
        "modelo": f"Asunto: Control presupuestario enero-octubre 2026 (para el consejo del 20)\n\nHola, Marta:\n\n"
                  f"Te dejo el libro P7_Control_presupuestario_2026-10_v01.xlsx y el PDF de una página para el consejo. "
                  f"Todos los controles cuadran.\n\n"
                  f"1. EBITDA de enero a octubre: {e(EBITDA)} € frente a {e(EBP)} € presupuestados ({e(EBITDA - EBP)} €). "
                  f"Lo que más pesa es el margen ({pc(mpr)} frente a {pc(mpp)}: {e(casc['Margen %'])} €) y el personal de "
                  f"almacén (+{e(imp[('Sueldos y salarios', 'ALM')]['Desv'])} €, horas extra de la campaña).\n"
                  f"2. Logroño: {e(-casc['Apertura Logroño'])} € fuera de presupuesto. La amortización "
                  f"({e(imp[('Amortización', 'ADM')]['Desv'])} €) y el seguro (+2.400 €) son diferencias temporales, no "
                  f"ahorros ni sobrecostes.\n"
                  f"3. Cierre previsto: EBITDA de {e(PREV)} € frente a 444.000 € (resultado {e(X['resultado_prev_base'])} € "
                  f"frente a 307.000 €). Con ventas −8 % en noviembre y diciembre bajaría a {e(esc['-8%|Logroño'][0])} €. Para "
                  f"llegar al presupuesto habría que vender {e(bo['ventas_novdic'])} € en esos dos meses "
                  f"(+{pc(bo['var'])}): no lo veo realista.\n\n"
                  f"Supuestos: los que pactamos (umbral 5 % y 3.000 €, Dirección en doceavas, 386,40 € de taxis sin centro de "
                  f"coste en «Sin asignar»).\nLibro de Paco: el resultado de 2025 que se presentó ({e(pres_res)} €) no era "
                  f"correcto; el bueno es {e(ok_res)} €. Faltaban la amortización, diciembre de transportes y la "
                  f"regularización de existencias. Tienes el detalle en la hoja Auditoría_Paco.\n\nUn saludo,",
        "criterios": ["Da las cifras clave (EBITDA real y presupuestado, previsión de cierre) y coinciden con el libro",
                      "Distingue desviaciones reales, temporales y fuera de presupuesto",
                      "Avisa del riesgo de cierre y de lo que habría que vender para cumplir",
                      "Contesta si el resultado de 2025 de Paco era correcto y con qué cifra",
                      "Breve, con supuestos y sin adjuntar 60 partidas en el cuerpo"],
    },
    "solucion_md":
        "### La idea\nDos tablas largas (presupuesto y real), un mapeo con excepciones y una tabla de detalle con "
        "SUMAR.SI.CONJUNTO. Todo lo que puede cambiar está en **Parámetros** con nombre; la hoja **Controles** dice si "
        "todo cuadra. El mes siguiente: CSV nuevo, cambiar Mes_corte y **Datos > Actualizar todo**.\n\n"
        f"### 1. El libro de Paco: no se reutiliza\n| Error | Dónde | Efecto en el resultado 2025 |\n|---|---|---|\n"
        f"| E1 SUMA sin diciembre | Real_2025!H17 | +{e(ef['E1'], 2)} € |\n"
        f"| E2 valor fijo 142.000 en personal de marzo | Real_2025!D7 | +{e(ef['E2'], 2)} € |\n"
        "| E3 `=D6/C$5`: todos los % dividen por ventas | Informe!E6:E21 | 0 (los % están mal) |\n"
        "| E4 el total de gastos suma el subtotal | Informe!B20:C20 | 0 en el resultado; total de gastos inflado |\n"
        "| E5 desviación de ventas al revés | Informe!D5 | 0 (signo cambiado) |\n"
        f"| E6 `SI.ERROR(…#¡REF!;0)`: amortización a 0 | Informe!B18 | +{e(ef['E6'], 2)} € |\n"
        "| E7 vínculo roto a presupuesto_2025.xlsx | Informe!C5:C19 | 0, pero no se puede actualizar |\n"
        f"| E8 cálculo manual: falta la regularización | todo el libro | +{e(ef['E8'], 2)} € |\n\n"
        f"Resultado presentado **{e(pres_res, 2)} €**; correcto **{e(ok_res, 2)} €** ({e(pres_res - ok_res, 2)} € de más).\n\n"
        "### 2. Presupuesto largo (Power Query)\nUna consulta por pestaña (o una función) con: `Table.Skip(Hoja, each [Column1] "
        "<> \"Cuenta\")`, Usar la primera fila como encabezado, filtrar Cuenta numérica, **quitar Total**, Anular "
        "dinamización de otras columnas (Cuenta, Descripción), mes a número con la tabla Meses y, en Administración, cambiar "
        "tipo con configuración regional. Dirección: columna con `{1..12}`, expandir e Importe/12. Anexar en **PptoLargo** "
        "(312 filas). Consolidar no sirve: las pestañas no tienen la misma forma.\n\n"
        "### 3. Real y mapeo\nEn la Tabla **Diario**:\n"
        "- `Cuenta3 =VALOR(IZQUIERDA([@Cuenta];3))`\n- `Mes =MES([@Fecha])`\n"
        "- `Dpto =SI([@CentroCoste]<>\"\";[@CentroCoste];BUSCARX([@Cuenta3];Reparto[Cuenta3];Reparto[CentroCoste];\"Sin asignar\"))`\n"
        "- `Partida =SI.ND(BUSCARX([@Cuenta];Excepciones[Cuenta];Excepciones[Partida]);BUSCARX([@Cuenta3];Mapeo[Cuenta3];Mapeo[Partida];\"SIN PARTIDA\"))`\n"
        "- `Importe =SI([@Tipo]=\"Gasto\";[@Debe]-[@Haber];[@Haber]-[@Debe])`\n\n"
        f"Excepciones: `62900099` (texto) → «Apertura Logroño». Control: `=CONTAR.SI(Diario[Partida];\"SIN PARTIDA\")` = 0. "
        f"Ventas netas {e(VENTAS, 2)} €; resultado real {e(RES, 2)} € = Σ Haber − Σ Debe.\n\n"
        "### 4. Detalle partida × departamento\n"
        "- `Real =SUMAR.SI.CONJUNTO(Diario[Importe];Diario[Partida];[@Partida];Diario[Dpto];[@Departamento];Diario[Mes];\"<=\"&Mes_corte)` (igual el presupuesto con PptoLargo)\n"
        "- `F/D =SI([@Tipo]=\"Gasto\";SI([@Desv]>0;\"D\";\"F\");SI([@Desv]<0;\"D\";\"F\"))`\n"
        "- `Importa =Y(ABS([@DesvPct])>=Umbral_pct;ABS([@Desv])>=Umbral_eur)` (sin presupuesto: solo el importe)\n\n"
        f"Importan **{NIMP}**:\n\n| Partida | Dpto | Desv. | % | F/D | Naturaleza |\n|---|---|---|---|---|---|\n"
        + "".join(f"| {r['Partida']} | {r['Departamento']} | {e(r['Desv'])} € | "
                  f"{pc(r['DesvPct']) if r['DesvPct'] == r['DesvPct'] and r['DesvPct'] is not None else '—'} | {r['FD']} | {r['Naturaleza']} |\n"
                  for r in sorted(X["importan"], key=lambda r: -abs(r["Desv"])))
        + f"\nNo importan aunque lo parezca: seguro (+20 %, 2.400 €, temporal), Seguridad Social de almacén (+4.800 €, 3,9 %), "
        f"ventas ({e(d_ventas)} €, {pc(d_ventas / X['ventas_ppto_acum'], 2)}).\n\n"
        "### 5. Previsión y escenarios\nPrevisión = real + presupuesto nov-dic, salvo: ventas y compras × (1 + Var_ventas); "
        "temporales = importe del año (seguro 14.400, amortización 96.000); financieros = real + `PAGOINT(5%/12;20;48;-85000)` "
        f"({e(X['ipmt20'], 2)}) + cuota 21 ({e(X['ipmt21'], 2)}) + 2 × 3.100 de póliza; Logroño = real + 2 × 6.500. "
        f"Comprobación: `=-PAGO.INT.ENTRE(5%/12;48;85000;10;21;0)` = {e(X['cumipmt_10_21'], 2)} €.\n\n"
        f"| Escenario | EBITDA 2026 | Resultado 2026 |\n|---|---|---|\n"
        f"| −8 % con Logroño | {e(esc['-8%|Logroño'][0], 2)} € | {e(esc['-8%|Logroño'][1], 2)} € |\n"
        f"| **0 % con Logroño (base)** | **{e(esc['+0%|Logroño'][0], 2)} €** | {e(esc['+0%|Logroño'][1], 2)} € |\n"
        f"| +4 % con Logroño | {e(esc['+4%|Logroño'][0], 2)} € | {e(esc['+4%|Logroño'][1], 2)} € |\n"
        f"| Sin Logroño | 13.000 € más en cada caso | |\n\n"
        f"**Buscar objetivo** (Definir la celda: EBITDA previsto; Con el valor: 444000; Cambiando la celda: Var_ventas): "
        f"{pc(bo['var'], 2)}, es decir, vender {e(bo['ventas_novdic'], 2)} € en noviembre y diciembre frente a "
        f"{e(bo['ventas_novdic_ppto'], 2)} € presupuestados.\n\n"
        f"### 6. Cascada del EBITDA (acumulado)\n{e(EBP, 2)} € presupuestado → volumen {e(casc['Ventas (volumen)'], 2)} → "
        f"margen % {e(casc['Margen %'], 2)} → personal {e(casc['Personal'], 2)} → otros gastos {e(casc['Otros gastos'], 2)} → "
        f"Logroño {e(casc['Apertura Logroño'], 2)} → temporales {e(casc['Temporales (seguro)'], 2)} → **{e(EBITDA, 2)} € real**. "
        "Volumen = (ventas reales − ppto) × margen % ppto; margen % = ventas reales × (margen % real − ppto). Insertar > "
        "Gráficos > Insertar gráfico de cascada, embudo, cotizaciones, superficie o radial > Cascada, y **Establecer como "
        "total** en la primera y la última columna.\n\n"
        "### 7. Página del consejo\nTres indicadores, `=ORDENARPOR(FILTRAR(Detalle[[Partida]:[Naturaleza]];Detalle[Importa]);"
        "ABS(FILTRAR(Detalle[Desv];Detalle[Importa]));-1)`, la cascada, 4 comentarios hechos con DECIMAL para que las cifras "
        "se actualicen, índice con HIPERVINCULO y `=\"Controles: \"&SI(Control_maestro;\"TODO OK\";\"REVISAR\")`.\n\n"
        f"### 8. Cambio inesperado (18/11)\nCon el CSV nuevo ({c18['lineas']} filas): Transportes ALM pasa a "
        f"{e(c18['real_624'])} € frente a {e(c18['ppto_624'])} € (+{e(c18['desv'])} €, +{pc(c18['pct'])}, D): ahora "
        f"**importa** ({c18['importan']} partidas). EBITDA real {e(c18['ebitda_real'], 2)} €; previsión "
        f"{e(c18['ebitda_prev'], 2)} €. Hay que cambiar el comentario 2 del consejo y avisar a Marta de que la cifra que vio "
        "ha cambiado.",
    "archivo_solucion": "p7-solucion.xlsx",
    "errores_tipicos": [
        "Leer como mala noticia una desviación positiva de ventas: en ingresos, positiva es favorable.",
        "Hacer la media de los % de desviación en vez de calcular el % del total.",
        "Comparar IZQUIERDA (texto) con Cuenta3 (número): #N/D, o ceros silenciosos si se tapa con SI.ERROR.",
        "Mapear por 3 dígitos y esconder Logroño en «Otros servicios».",
        "Sumar solo el Debe: los abonos de proveedores y la reclasificación de octubre se cuentan mal.",
        "Anular la dinamización con la columna Total dentro: el presupuesto sale el doble.",
        "Explicar como ahorro la amortización trimestral (es temporal).",
        "Prever «real + presupuesto restante» en las partidas temporales (seguro 16.800 €, amortización 88.000 €).",
        "Fiarse del libro de Paco: cálculo manual, vínculo roto y SI.ERROR que esconde un #¡REF!.",
        "Repartir el total de Dirección por estacionalidad cuando se pidió en doceavas partes.",
        "Cascada con los totales sin marcar («Establecer como total»): el EBITDA real sale como una barra flotante.",
        "Usar solo una condición del umbral (solo % o solo €).",
    ],
    "ampliaciones": [
        "Análisis horizontal (2026 frente a 2025) y vertical (% sobre ventas) de la cuenta de resultados.",
        "Modelo de datos con medidas (presupuesto, real, desviación) como puente hacia el cuadro de mando de P8.",
        "Proyección de 2027 con tasas de crecimiento por partida y una tabla de datos de dos variables (ventas × margen %).",
        "LAMBDA DESV.FAV en el Administrador de nombres para la desviación favorable en positivo.",
    ],
}
json.dump(proy, open(os.path.join(EXCEL, "proyectos", "p7.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
META = {
    "p7-datos": ("P7 · Control presupuestario: datos de partida",
                 "Presupuesto 2026 de Electro Cierzo en cinco pestañas, mapeo de cuentas y reparto por centro de coste; el "
                 "diario y el libro de Paco van aparte."),
    "p7-solucion": ("P7 · Control presupuestario: solución",
                    "Libro resuelto: presupuesto y real en formato largo, detalle con desviaciones, previsión con escenarios, "
                    "cascada del EBITDA, página del consejo, auditoría del libro de Paco y controles."),
    "p7-control-2025-paco": ("P7 · Libro heredado de Paco (2025)",
                             "Control presupuestario de 2025 con 8 errores para auditar."),
}
for k, (t, d) in META.items():
    json.dump({"titulo": t, "descripcion": d, "nivel": "n6"}, open(os.path.join(LIBROS, f"{k}.meta.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
print("ok")
