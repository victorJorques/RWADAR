# -*- coding: utf-8 -*-
"""P8 · genera proyectos/p8.json y los .meta.json con las cifras calculadas por p8_datos.py (p8_verdad.json)."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p8_datos as P  # noqa: E402

BASE = os.path.dirname(P.LIBROS)
V = json.load(open(P.VERDAD, encoding="utf-8"))
C, O, N = V["control"], V["oct"], V["nov"]
for _d in (O, N):
    for _k, _x in _d.items():
        if isinstance(_x, str):
            _d[_k] = float(_x)
D = P.cargar_limpio(P.DICIEMBRE)
v = D["ventas"]
nov25 = v[v.FinMes == P.fin_mes(2025, 11)].ImporteNeto.sum()
var_nov = (N["ventas_mes"] / nov25 - 1) * 100
cumpl_nov = N["ventas_mes"] / N["ppto_mes"] * 100


def es(x, d=2):
    return f"{x:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")


for nombre, titulo, desc in [
    ("p8-datos", "P8 · Datos del cuadro de mando de dirección",
     "Instrucciones, maestros (delegaciones, familias, clientes), guion de entrevista, plantilla del diccionario de indicadores y cifras de cuadre de cada director."),
    ("p8-solucion", "P8 · Solución: cuadro de mando de dirección (plan B)",
     "Cuadro de una página con 7 indicadores, selector de mes y delegación, semáforos, gráficos, minigráficos, controles, casos de prueba y explicación del modelo con Power Pivot."),
    ("p8-fuentes", "P8 · Carpeta de fuentes del cuadro de mando (ZIP)",
     "Las 6 fuentes cerradas a octubre de 2026 y la carpeta Llega_en_diciembre con noviembre."),
]:
    with open(os.path.join(P.LIBROS, nombre + ".meta.json"), "w", encoding="utf-8") as f:
        json.dump({"titulo": titulo, "descripcion": desc, "nivel": "n6"}, f, ensure_ascii=False, indent=1)

proyecto = {
    "id": "p8",
    "titulo": "Cuadro de mando de dirección",
    "departamento": "Dirección general",
    "nivel_requerido": "n6",
    "horas": 14,
    "resumen": "Proyecto final: pactas con cuatro directores 7 indicadores, juntas 6 fuentes de departamentos distintos y entregas a la directora general una página que se actualiza cada mes con un botón, cuadra con cada fuente y avisa sola si algo falla.",
    "habilidades": ["Entrevistas y diccionario de indicadores", "Boceto de una página", "Power Query de 6 fuentes", "Tabla de alias",
                    "Anular dinamización", "Configuración regional y codificación", "Tabla de calendario", "Modelo de datos en estrella",
                    "Medidas DAX (inteligencia de tiempo y fotos de fin de mes)", "VALORCUBO", "SUMAR.SI.CONJUNTO (plan B)",
                    "Segmentaciones", "Semáforos accesibles con SI.CONJUNTO", "Minigráficos", "Controles y control maestro",
                    "Accesibilidad y protección", "Manual de actualización", "IA con verificación", "RGPD: solo agregados"],
    "correo": {
        "de": "Carmen Soler (Directora general)",
        "para": "ti",
        "asunto": "Un cuadro de mando para el comité",
        "cuerpo": "Hola:\n\nCada mes cada director me trae sus números en un formato distinto y no hay forma de ver la película entera. Quiero una sola página con lo importante del mes: ventas, margen, lo que nos deben, el stock, la plantilla… Que se pueda ver por delegación y que lo podáis actualizar vosotros cada mes sin depender de nadie.\n\nHabla con quien necesites. En el comité de diciembre quiero ver una prueba con noviembre, y estrenarlo en enero con el cierre del año.\n\nCarmen\n\n(Lunes, 23/11/2026)"
    },
    "preguntas_previas": {
        "pregunta": "Antes de construir nada: escribe el correo a Carmen con lo que necesitas aclarar y a quién vas a entrevistar (de 6 a 10 preguntas concretas).",
        "modelo": "Hola, Carmen:\n\nPara que la página te sirva desde el primer comité, propongo hablar 15 minutos con Marta, Javier, Andrés y Lucía esta semana y traerte el jueves un diccionario de indicadores y un boceto para que los apruebes. Antes, unas preguntas:\n1. ¿Cuántos indicadores como máximo? Propongo 7: ventas, margen, cartera vencida, PMC, stock y cobertura, plantilla y absentismo, y EBITDA.\n2. ¿Los quieres del mes, acumulados del año, frente al año anterior y frente al presupuesto, o solo algunos?\n3. ¿Quién fija los umbrales del semáforo (verde, ámbar, rojo)? ¿Y las metas de cada indicador?\n4. El filtro de delegación: el stock es del almacén central y el EBITDA es de empresa. ¿Te parece que en esos dos la tarjeta diga «dato de empresa»?\n5. ¿Dónde lo vas a ver: pantalla de la sala, PDF o tu iPad? (Cambia la herramienta: en Mac e iPad no hay Power Pivot.)\n6. ¿Hay algo confidencial que no deba aparecer? Propongo solo datos agregados, sin personas.\n7. ¿Qué día está cerrado el mes y quién lo actualiza si yo no estoy?\n8. Logroño abre en noviembre sin presupuesto: ¿lo muestro aparte o junto al resto?\n\nCon tus respuestas y las entrevistas te mando el diccionario para aprobar antes de empezar.\n\nUn saludo",
        "criterios": ["Propone entrevistas con los cuatro directores y pide aprobar el diccionario y el boceto ANTES de construir.",
                      "Pregunta cuántos indicadores y con qué comparación (mes, acumulado, interanual, presupuesto).",
                      "Pregunta quién fija metas y umbrales del semáforo.",
                      "Pregunta si el filtro de delegación aplica a todo (stock central, EBITDA de empresa).",
                      "Pregunta dónde y en qué dispositivo se verá (Mac, iPad, PDF) y qué es confidencial.",
                      "Pregunta cuándo está cerrado el dato y quién actualiza o sustituye."]
    },
    "aclaraciones": [
        {"pregunta": "Carmen: ¿cuántos indicadores y con qué comparación?", "respuesta": "Siete como mucho, los que propones. De cada uno: el mes, el acumulado del año, frente al año anterior y frente al presupuesto o la meta. Si algo no tiene dato, que lo diga."},
        {"pregunta": "Carmen: ¿quién fija los umbrales del semáforo?", "respuesta": "Los umbrales los fijo yo: verde si llega al 100 % de la meta, ámbar entre el 95 y el 100 %, rojo por debajo del 95 %. En los de «cuanto menos, mejor» (PMC, cobertura, cartera vencida, absentismo) es al revés. Las metas las pone cada director."},
        {"pregunta": "Carmen: ¿el filtro de delegación vale para todo? ¿Dónde lo vas a ver?", "respuesta": "Para todo lo que se pueda repartir. El stock es del almacén central y el EBITDA es de empresa: que la tarjeta lo diga. Lo veo en PDF A4 apaisado en el comité y el libro en SharePoint; yo uso Mac e iPad."},
        {"pregunta": "Javier: ¿qué es «ventas» y contra qué presupuesto?", "respuesta": "Lo mismo que en el informe de ventas: ImporteNeto sin IVA, con devoluciones, portes y el pronto pago. El presupuesto es el aprobado por el consejo (9.480.000 € en 2026, por delegación y familia), no los objetivos de los comerciales. Logroño abrió el 02/11/2026 y no tiene presupuesto."},
        {"pregunta": "Javier: ¿cómo calculo el margen y cuál es la meta?", "respuesta": "Σ (ImporteNeto − Cantidad × CosteUnitario) / Σ ImporteNeto, con el coste que trae cada línea. Nunca la media de porcentajes. Meta: 28 %."},
        {"pregunta": "Marta: ¿cartera vencida y PMC?", "respuesta": "Cartera vencida = vencido a más de 60 días / pendiente, a fin de mes; meta ≤ 10 %. PMC = saldo de clientes / ventas con IVA (21 %) de los 3 últimos meses × los días de esos 3 meses (92 de agosto a octubre); meta ≤ 70 días. Agosto no se cerró: que salga «sin dato»."},
        {"pregunta": "Andrés: ¿stock y cobertura?", "respuesta": "Stock = unidades × coste de ficha a fin de mes. Cobertura = stock / (coste de ventas de los últimos 90 días / 90); meta ≤ 60 días. Es del almacén central: no lo repartas. Los «Sin ficha» valen 0 hasta que tengan ficha, como en tu proyecto de stock. Tengo datos desde mayo."},
        {"pregunta": "Lucía: ¿plantilla y absentismo? ¿Puedo tener los datos por persona?", "respuesta": "No: te paso la plantilla ya agregada por departamento y delegación. FTE al cierre del mes y absentismo = días de IT / días teóricos; meta ≤ 4 %. Nada de nombres ni de diagnósticos en el cuadro."},
        {"pregunta": "Marta: ¿cómo calculo el EBITDA y contra qué lo comparo?", "respuesta": "Ventas − coste de ventas − personal − otros gastos de explotación. Acumulado del año frente al presupuesto acumulado de los MISMOS meses (no frente al anual). En el archivo los gastos vienen en positivo. Meta: 100 %."},
        {"pregunta": "Marta: ¿cuándo está cerrado el dato y quién lo actualiza?", "respuesta": "El 5.º día laborable del mes siguiente. Lo actualizas tú; tu suplente es Administración (Nuria). Los meses cerrados no se tocan: si al cargar uno nuevo cambia uno viejo, me avisas."},
        {"pregunta": "Carmen: ¿qué es confidencial?", "respuesta": "Nada de personas ni de salud. Tampoco hace falta el NIF de los clientes: muchos autónomos usan su DNI."},
    ],
    "datos_md": (
        "Descomprime **p8-fuentes.zip** en tu equipo (por ejemplo, en `C:\\Cuadro_mando`):\n\n"
        "| Carpeta o archivo | Qué es |\n|---|---|\n"
        f"| `Fuentes\\ventas_lineas_2025_2026.csv` | Detalle de ventas que ha sacado Informática del ERP, de enero de 2025 a octubre de 2026 ({es(V['lineas_base'], 0)} líneas). Las de 2026 son las de tu informe de ventas. |\n"
        "| `Fuentes\\presupuesto_ventas_2026.xlsx` | Presupuesto aprobado por delegación × familia × mes, tal como lo hizo Finanzas. |\n"
        "| `Fuentes\\saldos_clientes_fin_mes.csv` | Pendiente y vencido a más de 60 días de cada cliente a fin de mes (2026). |\n"
        "| `Fuentes\\stock_fin_mes.csv` | Unidades y coste de cada artículo a fin de mes, con su clase ABC. |\n"
        "| `Fuentes\\plantilla_fin_mes.csv` | Plantilla agregada por departamento y delegación a fin de mes: activos, FTE, días de IT y días teóricos. |\n"
        "| `Fuentes\\pyg_mensual.csv` | Cuenta de resultados de 2026 por partida y mes, real y presupuesto. |\n"
        "| `Llega_en_diciembre\\` | Los 5 CSV exportados otra vez con noviembre y las cifras de cuadre de noviembre. **No los abras hasta el paso 9.** |\n"
        "| `Maestros\\p8-datos.xlsx` | Instrucciones, delegaciones, familias, clientes, guion de entrevista, plantilla del diccionario y **Cifras_cuadre**. |\n\n"
        "Cinco departamentos, cinco formas de exportar. Antes de construir, perfila cada fuente: **codificación** y separador, cómo se llama cada delegación en cada archivo, qué meses hay y cuáles faltan, qué grano tiene cada tabla, qué vacíos significan «cero» y cuáles «no hay dato», y si hay filas que no son datos. "
        "Ojo con las **fotos de fin de mes** (saldos, stock, plantilla): no se suman entre meses. Y en el modelo solo entra lo que el cuadro necesita."
    ),
    "archivos": [
        {"archivo": "p8-fuentes.zip", "titulo": "Carpeta Cuadro_mando (ZIP)", "descripcion": "Fuentes (6 archivos cerrados a octubre de 2026), Llega_en_diciembre (noviembre), Maestros y Cuadro."},
        {"archivo": "p8-datos.xlsx", "titulo": "Maestros y cifras de cuadre", "descripcion": "Instrucciones, Delegaciones, Familias, Clientes, Guion_entrevista, Diccionario_plantilla y Cifras_cuadre."},
    ],
    "pasos": [
        {"titulo": "1. Entrevistas y diccionario de indicadores", "md": "Manda tus preguntas a Carmen y haz las cuatro entrevistas con el **Guion_entrevista**. Con las respuestas, rellena el **diccionario**: indicador, definición, fórmula, fuente, responsable, meta, sentido (más o menos es mejor), ¿por delegación? y cuándo está cerrado. Carmen lo aprueba antes de que construyas.", "pista": "Pregunta cosas concretas: «¿el margen es sobre qué coste?», «¿qué meta?», «¿qué te alarmaría?». A una pregunta vaga («¿qué quieres ver?») te contestarán con vaguedad. Máximo 7 indicadores."},
        {"titulo": "2. Boceto de una página", "md": "Dibuja la página antes de abrir Excel: selector de mes y delegación arriba, 7 tarjetas, 4-5 gráficos, las 5 desviaciones del P&L y un recuadro «Qué hay que mirar este mes». A4 apaisado.", "pista": "Lo urgente arriba a la izquierda. Cada tarjeta: valor, frente al año anterior, frente a la meta, flecha y semáforo con texto. Pocos gráficos y sin 3D."},
        {"titulo": "3. Perfilar y limpiar las 6 fuentes con Power Query", "md": "Una consulta por fuente, con un parámetro de ruta a la carpeta `Fuentes`. Deja una hoja **Calidad_datos**: problema, filas afectadas y decisión.", "pista": "Datos > De texto/CSV y mira la vista previa con calma: Origen del archivo (no todos son UTF-8), delimitador, tipo con configuración regional Español (España). Usa UNICOS o la lista de valores del filtro para ver cómo se escribe cada delegación en cada archivo y monta una tabla de alias. El presupuesto no viene en formato tabla."},
        {"titulo": "4. Dimensiones y calendario", "md": "Crea las dimensiones **Delegaciones** (con alias), **Familias**, **Clientes** (sin NIF) y **Calendario** (Fecha, Año, Mes, NombreMes, AñoMes, Trimestre, FinDeMes, EsMesCerrado), sin huecos de 2025 a 2026.", "pista": "El calendario se genera en Power Query con List.Dates, no se escribe a mano. En Power Pivot, márcalo como tabla de fechas."},
        {"titulo": "5. Modelo de datos en estrella y medidas (plan A)", "md": "Relaciona hechos con dimensiones (Datos > Herramientas de datos > Relaciones o Administrar modelo de datos) y crea las medidas con nombre en español: ventas, margen %, interanual, acumulado, cumplimiento, saldos, stock, FTE, absentismo y EBITDA.", "pista": "El presupuesto tiene otro grano: se relaciona con Calendario, Delegaciones y Familias, nunca con Ventas. Saldos, stock y FTE son fotos: CALCULATE(…; LASTDATE(Calendario[Fecha])). Usa DIVIDE para no tener #¡DIV/0!. Si el separador «;» da error de sintaxis, prueba «,»."},
        {"titulo": "6. Plan B sin Power Pivot", "md": "Para Mac, iPad o navegador: anexa las consultas en una **tabla única** (mes, indicador, delegación, detalle, valor) y calcula cada tarjeta con SUMAR.SI.CONJUNTO. Las fotos se piden con el fin de mes exacto, nunca con un rango.", "pista": "Para «Todas» usa como criterio de delegación \"*\" (cualquier texto): `=SI(Deleg=\"Todas\";\"*\";Deleg)`. Para el año anterior, `FIN.MES(Mes;-12)`. Si un mes no tiene filas (CONTAR.SI.CONJUNTO = 0), muestra «sin dato»."},
        {"titulo": "7. La hoja Cuadro", "md": "Selectores, 7 tarjetas con semáforo de símbolo y texto, minigráficos de 12 meses, líneas de ventas frente al año anterior, barras de cumplimiento por delegación, columnas apiladas de antigüedad de saldos, stock por clase ABC, las 5 desviaciones del P&L y títulos dinámicos. Escribe tú las 3 frases de «Qué hay que mirar».", "pista": "Semáforo con SI.CONJUNTO sobre el cumplimiento; en los de «menos es mejor», cumplimiento = meta / valor. Los minigráficos están en Insertar > Minigráficos > Línea. Para que un gráfico deje hueco en un mes sin dato, la serie tiene que dar #N/D (NOD()), no 0."},
        {"titulo": "8. Controles, casos de prueba, accesibilidad y manual", "md": "Hoja **Controles** con cada tarjeta frente a su fuente (Cifras_cuadre) y control maestro en el encabezado del cuadro. Hoja de **casos de prueba** (uno por medida, también las que te proponga la IA). Revisar > Comprobar accesibilidad, protección de la hoja del cuadro, Inspeccionar documento, **Manual** de una página y registro de cambios.", "pista": "Un caso de prueba es un dato que calculas a mano filtrando el CSV (por ejemplo, ventas de octubre de 2026 en Pamplona) y comparas con la medida. Si una medida suma tres fotos en un trimestre, está mal."},
        {"titulo": "9. Cargar noviembre (prueba para el comité de diciembre)", "md": "Copia los 5 CSV de `Llega_en_diciembre` en `Fuentes`, pulsa **Datos > Actualizar todo** ([[Ctrl]]+[[Alt]]+[[F5]]) y comprueba con `LEEME_noviembre.txt`. Octubre no puede cambiar. Logroño aparece por primera vez. Intenta hacerlo en menos de 30 minutos.", "pista": "Anota antes de actualizar las cifras de octubre (en el registro de cambios) para el control «octubre no cambia». Si Logroño no aparece en la segmentación, mira la tabla de alias y la dimensión Delegaciones."},
        {"titulo": "10. Entrega y defensa oral (15 minutos)", "md": "Manda a Carmen el PDF y el enlace al libro con un correo breve. En la defensa explica cada indicador, cómo se actualiza, qué limitaciones tiene y qué pasa si falta un dato.", "pista": "Prepara la respuesta a «¿por qué el PMC no es el de Marta?», «¿por qué Logroño no tiene semáforo?» y «¿qué pasa si agosto no se cierra nunca?»."},
        {"titulo": "11. Cambio inesperado (enero de 2027)", "md": "Carmen te escribe:\n\n> Ya tenemos diciembre, con Logroño en todas las fuentes. Me gustaría añadir un octavo indicador: nº de clientes activos. Carmen\n\nComprueba que al cargar diciembre no se rompe nada y contesta a Carmen.", "pista": "Un octavo indicador rompe la regla de una página y 7 tarjetas: propón sustituir uno (¿cuál aporta menos?) o una segunda página. Define «cliente activo» (¿con al menos una venta neta positiva en el mes?) y con qué medida se calcula (recuento distinto de clientes)."},
    ],
    "controles": [
        {"pregunta": "Ventas netas de octubre de 2026, toda la empresa (€)", "respuesta": C["ventas_oct"], "tolerancia": 0.01,
         "pista": "Tiene que coincidir con el control del ERP de Cifras_cuadre. Si no cuadra, revisa que no hayas quitado devoluciones, portes o el pronto pago."},
        {"pregunta": "Variación interanual de las ventas de Lleida, enero-octubre de 2026 frente a enero-octubre de 2025 (%, con un decimal)", "respuesta": round(C["var_lleida_eneoct_pct"], 1), "tolerancia": 0.1,
         "pista": "Si te sale una variación enorme (más del 100 %), en 2025 te falta parte de Lleida: mira cómo se llamaba la delegación en el ERP antes de octubre de 2025."},
        {"pregunta": "Margen bruto de la empresa, enero-octubre de 2026 (%, con un decimal)", "respuesta": round(C["margen_eneoct_pct"], 1), "tolerancia": 0.1,
         "pista": "Σ (ImporteNeto − Cantidad × CosteUnitario) / Σ ImporteNeto de los diez meses. La media de los márgenes de cada mes no vale."},
        {"pregunta": "Cartera vencida a más de 60 días a 31/10/2026, empresa (% del pendiente, con un decimal)", "respuesta": round(C["vencida60_oct_pct"], 1), "tolerancia": 0.1,
         "pista": f"Solo la foto del 31/10: el pendiente debe dar {es(V['cuadre']['pendiente'])} € (Cifras_cuadre). Si sumas varios meses, el porcentaje parece bien pero el pendiente no cuadra."},
        {"pregunta": "PMC a 31/10/2026, empresa (días, con un decimal)", "respuesta": round(C["pmc_oct"], 1), "tolerancia": 0.1,
         "pista": "Saldo a 31/10 / (ventas de agosto, septiembre y octubre × 1,21) × 92. No uses el saldo de agosto: no existe, y no hace falta."},
        {"pregunta": "Cobertura de stock a 31/10/2026 (días, con un decimal)", "respuesta": round(C["cobertura_oct"], 1), "tolerancia": 0.1,
         "pista": f"Stock valorado a 31/10 ({es(V['cuadre']['stock'])} €, el de Andrés) / (coste de ventas de los 90 días que acaban el 31/10, es decir, del 03/08 al 31/10 / 90). El coste de cada línea es Cantidad × CosteUnitario."},
        {"pregunta": "Absentismo de la empresa, enero-octubre de 2026 (%, con un decimal)", "respuesta": round(C["absentismo_eneoct_pct"], 1), "tolerancia": 0.1,
         "pista": "Σ días de IT / Σ días teóricos de los diez meses, de todas las delegaciones. Si el archivo no se lee bien (letras raras), revisa la codificación al importar."},
        {"pregunta": "Cumplimiento del EBITDA acumulado de enero a octubre de 2026 frente al presupuesto de esos mismos meses (%, con un decimal)", "respuesta": round(C["ebitda_cumpl_eneoct_pct"], 1), "tolerancia": 0.1,
         "pista": f"EBITDA = ventas − coste de ventas − personal − otros gastos de explotación (sin amortización ni intereses). Los gastos vienen en positivo: réstalos. El real de enero a octubre tiene que dar {es(O['ebitda_ytd_real'])} €, la cifra de Marta en Cifras_cuadre (la de tu control presupuestario, con la factura del 18/11). Compara con el presupuesto de enero a octubre, no con el del año."},
    ],
    "entregables": [
        "Diccionario de 7 indicadores y boceto aprobados por Carmen antes de construir.",
        "Libro P8_Cuadro_mando_2026-11_v03.xlsx en la carpeta Cuadro: Léame, Cuadro, Diccionario, Parámetros, Controles (maestro en verde), casos de prueba, Calidad_datos, consultas de Power Query y modelo (o plan B) y Manual de actualización.",
        "PDF del cuadro de noviembre en A4 apaisado, una página, para el comité de diciembre.",
        "Correo de entrega a Carmen (máximo 15 líneas).",
        "Defensa oral de 15 minutos: indicadores, actualización, limitaciones y qué pasa si falta un dato.",
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: suma saldos, stock o plantilla entre meses, o las tarjetas no cuadran con su fuente.",
            "Aceptable: cuadran 5 de las 7 tarjetas; algún error en el interanual o en el presupuesto.",
            "Bien: cuadran las 7 tarjetas con su fuente; interanual y presupuesto correctos; agosto sale como «sin dato».",
            "Excelente: además, un caso de prueba calculado a mano para cada medida (también las que propuso la IA) y documenta los problemas de las fuentes con su efecto."]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: copia los informes de cada director en una hoja.",
            "Aceptable: una tabla única frágil, con rangos fijos o valores escritos a mano.",
            "Bien: estrella con calendario y medidas con nombre (o plan B con tabla única y parámetros con nombre); dimensiones con alias.",
            "Excelente: además, diccionario de indicadores, convenciones de nombres y medidas comentadas; plan A y plan B coherentes."]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: hay que rehacerlo cada mes.",
            "Aceptable: se actualiza tocando las consultas o copiando y pegando.",
            "Bien: dejar los archivos en Fuentes y Actualizar todo; controles que avisan; noviembre cargado sin cambiar octubre.",
            "Excelente: además, la suplente lo actualiza siguiendo el manual sin ayuda (probado con otra persona) y el cambio de enero no rompe nada."]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: más de 10 gráficos, gráficos 3D o semáforos solo de color.",
            "Aceptable: muchos datos sin jerarquía; no cabe en una página.",
            "Bien: una página A4, 7 tarjetas, 4-5 gráficos limpios, semáforos con símbolo y texto, minigráficos, títulos dinámicos.",
            "Excelente: además, se lee en 30 segundos: lo urgente primero, títulos que dicen la conclusión, texto alternativo y comprobación de accesibilidad sin errores."]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: empieza a construir sin entrevistas ni diccionario.",
            "Aceptable: hace entrevistas, pero los indicadores quedan sin definición, meta o responsable.",
            "Bien: diccionario pactado y aprobado; correo y defensa claros, con cifras que coinciden con el libro.",
            "Excelente: además, negocia lo que no se puede medir con los datos actuales (8.º indicador, Logroño, agosto) y propone cómo conseguirlo."]},
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas a Carmen la prueba de noviembre para el comité (máximo 15 líneas).",
        "modelo": (
            "Asunto: Cuadro de mando · prueba con noviembre para el comité\n\nHola, Carmen:\n\n"
            "Te dejo en la carpeta de Dirección el PDF de noviembre y el libro (se abre en el Mac y en el iPad). Los controles están en verde: cada tarjeta cuadra con la cifra de su responsable.\n\n"
            "Lo que hay que mirar:\n"
            f"1. Margen: {es(N['margen_mes_pct'], 1)} % en noviembre frente a una meta del 28 %. Baja desde julio y es la causa principal de que el EBITDA acumulado vaya al {es(N['ebitda_cumpl_pct'], 1)} % del presupuesto. Propongo revisarlo con Javier por familia.\n"
            f"2. Cobros: la cartera vencida a más de 60 días sube al {es(N['vencida_pct'], 1)} % del pendiente (meta 10 %), y casi la mitad es de un solo cliente. Marta tendría que decidir si se le corta el crédito.\n"
            f"3. Logroño vende {es(V['ventas_nov_logrono'])} € en su primer mes; no tiene presupuesto ni año anterior, así que sale «sin dato» y no en rojo. Parte de esas ventas eran de Zaragoza.\n\n"
            f"Ventas de noviembre: {es(N['ventas_mes'])} € ({es(cumpl_nov, 1)} % del presupuesto del mes). PMC y cobertura de stock, en verde.\n\n"
            "Límites: agosto no tiene saldos (sale «sin dato»), el stock empieza en mayo y la plantilla en enero de 2026, así que esos indicadores aún no tienen interanual. El stock y el EBITDA son de empresa: no cambian con el filtro de delegación.\n\n"
            "Cada mes, el 5.º día laborable, se dejan los archivos en Fuentes y se pulsa Actualizar todo; el manual está en el libro y Nuria puede hacerlo si yo no estoy.\n\nUn saludo"),
        "criterios": ["Las cifras coinciden con las del libro y con el PDF.", "Da 3 conclusiones con cifra, causa probable y propuesta de acción, lo urgente primero.",
                      "Explica los límites de los datos (agosto, stock desde mayo, plantilla sin año anterior, Logroño sin presupuesto).",
                      "Dice cómo se actualiza y quién la sustituye.", "Es breve, no adjunta tablas y se adapta a una directora general."]
    },
    "solucion_md": "",
    "archivo_solucion": "p8-solucion.xlsx",
    "errores_tipicos": [
        "Empezar a construir sin el diccionario de indicadores pactado y aprobado.",
        "Relacionar el presupuesto (delegación × familia × mes) directamente con la tabla de ventas.",
        "Sumar fotos de fin de mes: el saldo del trimestre como suma de tres saldos, o el stock acumulado del año.",
        "Columna calculada de margen % que luego se promedia, en lugar de Σ margen / Σ ventas.",
        "Una tabla de calendario con huecos o sin marcar como tabla de fechas.",
        "Filtro de delegación que «filtra» el stock central o el EBITDA y los deja a cero.",
        "No mapear «Lérida» y «Pamplona/Iruña»: Lleida crece un disparate en 2026 y Pamplona sale sin presupuesto.",
        "Poner 0 en agosto (saldos) o en los meses sin stock: el gráfico se hunde y el PMC o la cobertura salen mal.",
        "Importar la plantilla como UTF-8 («Almac�n») o el stock con el código como número (000144 → 144).",
        "Comparar el EBITDA acumulado con el presupuesto del año entero, o sumar los gastos en positivo.",
        "Más de 7 indicadores, semáforos solo de color o gráficos 3D.",
        "Copiar las medidas que propone la IA sin un caso de prueba calculado a mano.",
        "Meter datos de personas en el modelo (NIF de autónomos, nombres de la plantilla).",
    ],
    "ampliaciones": [
        "Macro u Office Script que exporta un PDF por delegación.",
        "Power BI como siguiente paso (certificación PL-300), sin hacerlo dentro del proyecto.",
        "Python en Excel para un análisis de cohortes de clientes, si la licencia lo permite.",
        "Hoja de previsión de ventas del primer trimestre de 2027.",
        "Segunda página para el 8.º indicador (clientes activos) con recuento distinto de clientes por mes y delegación.",
    ],
}

SOL = f"""### La idea
Primero se pacta qué se mide; después se construye. Power Query limpia las 6 fuentes y las deja en un modelo en estrella (plan A, Power Pivot en Windows) o en una tabla única (plan B, el libro de la solución, que se abre en Mac e iPad). Cada tarjeta es una medida o un SUMAR.SI.CONJUNTO; la hoja **Controles** dice si todo cuadra. Cada mes: archivos nuevos en `Fuentes` y **Datos > Actualizar todo** ([[Ctrl]]+[[Alt]]+[[F5]]).

### 1. Diccionario (lo que sale de las entrevistas)
| Indicador | Fórmula | Meta | ¿Por delegación? |
|---|---|---|---|
| Ventas netas | Σ ImporteNeto; acumulado; interanual; ventas / presupuesto | Presupuesto | Sí |
| Margen bruto % | Σ (ImporteNeto − Cantidad × CosteUnitario) / Σ ImporteNeto | 28 % | Sí |
| Cartera vencida > 60 | Σ VencidoMas60 / Σ Pendiente (foto) | ≤ 10 % | Sí |
| PMC | Saldo / (ventas 3 meses × 1,21) × días de esos 3 meses | ≤ 70 días | Sí |
| Stock y cobertura | Σ Unidades × Coste; stock / (coste 90 días / 90) | ≤ 60 días | No |
| Plantilla y absentismo | FTE al cierre; Σ días IT / Σ días teóricos | ≤ 4 % | Sí |
| EBITDA acumulado | Ventas − coste − personal − otros gastos, frente al ppto de los mismos meses | 100 % | No |

Semáforo: verde ≥ 100 % de la meta, ámbar 95-100 %, rojo < 95 %. En los de «menos es mejor», cumplimiento = meta / valor.

### 2. Power Query: lo que hay que arreglar en cada fuente
- **Ventas** (UTF-8, «;», coma decimal): la delegación se llama «Lérida» hasta el 30/09/2025 ({es(V['lineas_lerida'], 0)} líneas) y «Lleida» desde octubre; Pamplona viene como «Pamplona/Iruña». Tabla **Alias** (NombreQueLlega → Delegacion) y **Combinar consultas** (externa izquierda). Columna Coste = Cantidad × CosteUnitario.
- **Presupuesto**: quitar 2 filas superiores, usar la primera fila como encabezado, filtrar la fila TOTAL (si no, el presupuesto sale doble), quitar «Total 2026» y **Anular dinamización de otras columnas** con Delegación y Familia seleccionadas: 21 filas × 12 meses = 252. FinMes = Date.EndOfMonth(#date(2026, Mes, 1)). Total: 9.480.000 €.
- **Saldos**: no hay 31/08/2026. No se rellena: se muestra «sin dato».
- **Stock**: CodArticulo como **Texto** antes de cambiar tipos; empieza el 31/05/2026; {V['sin_ficha']} artículos «Sin ficha» sin coste (valen 0, como en P6).
- **Plantilla**: Origen del archivo **1252: Europeo occidental (Windows)**; con UTF-8 sale «Almac�n».
- **P&L**: Real vacío en noviembre y diciembre = no cerrado (null, no 0). Signo: +1 en «Ventas», −1 en el resto. EnEBITDA = 1 en Ventas, Coste de ventas, Personal y Otros gastos de explotación.
- **Clientes**: fuera la columna NIF ({V['nif_dni']} son DNI de autónomos).

### 3. Plan A: modelo y medidas
Estrella: Ventas → Calendario, Clientes, Delegaciones, Familias; Ppto → Calendario, Delegaciones, Familias; Saldos, Stock y Plantilla → Calendario (fin de mes). El calendario es diario, sin huecos, marcado como tabla de fechas. Medidas (en DAX las funciones van en inglés; si «;» da error, usa «,»):
```
Ventas := SUM(Ventas[ImporteNeto])
Margen % := DIVIDE(SUMX(Ventas; Ventas[ImporteNeto] - Ventas[Cantidad] * Ventas[CosteUnitario]); [Ventas])
Ventas AA := CALCULATE([Ventas]; SAMEPERIODLASTYEAR(Calendario[Fecha]))
Cumplimiento % := DIVIDE([Ventas]; SUM(Ppto[Importe]))
Saldo clientes := CALCULATE(SUM(Saldos[Pendiente]); LASTDATE(Calendario[Fecha]))
Absentismo % := DIVIDE(SUM(Plantilla[DiasIT]); SUM(Plantilla[DiasTeoricos]))
```
Las tarjetas: tablas dinámicas pequeñas o `VALORCUBO("ThisWorkbookDataModel";"[Measures].[Ventas]";…)` con las segmentaciones de AñoMes y Delegación (Segmentación > Conexiones de informe). Stock y EBITDA, sin la segmentación de delegación.

### 4. Plan B: las fórmulas del libro de la solución
Nombres: `Mes` y `Deleg` (selectores amarillos del Cuadro), `DelegCrit` = `=SI(Deleg="Todas";"*";Deleg)`, `MesAA` = `=FIN.MES(Mes;-12)`, `Ini3` = `=FIN.MES(Mes;-3)`, `IniAnio` = `=FECHA(AÑO(Mes);1;1)` y las metas en **Parámetros**.
- Ventas del mes: `=SUMAR.SI.CONJUNTO(Hechos[Valor];Hechos[Indicador];"Ventas";Hechos[FinMes];Mes;Hechos[Delegacion];DelegCrit)`
- Año anterior con «sin dato»: `=SI(CONTAR.SI.CONJUNTO(Hechos[Indicador];"Ventas";Hechos[FinMes];MesAA)=0;"sin dato";SUMAR.SI.CONJUNTO(Hechos[Valor];Hechos[Indicador];"Ventas";Hechos[FinMes];MesAA;Hechos[Delegacion];DelegCrit))`
- Foto (saldo): el criterio es `Hechos[FinMes];Mes`, nunca un rango de meses.
- PMC: saldo / (`SUMAR.SI.CONJUNTO(…"Ventas";Hechos[FinMes];">"&Ini3;Hechos[FinMes];"<="&Mes;…)` × (1 + IVA)) × (Mes − Ini3).
- Cobertura: stock / (`SUMAR.SI.CONJUNTO(Coste_diario[Coste];Coste_diario[Fecha];">"&(Mes-90);Coste_diario[Fecha];"<="&Mes)` / 90).
- Semáforo: `=SI(ESNUMERO(G6);SI.CONJUNTO(G6>=1;"✓ En meta";G6>=UmbralAmbar;"! Vigilar";VERDADERO;"✗ Fuera de meta");"– Sin dato")`
- 5 desviaciones: clave `=ABS(D34)+FILA()/1000000` y `=INDICE($A$34:$A$48;COINCIDIR(K.ESIMO.MAYOR($E$34:$E$48;A52);$E$34:$E$48;0))`.
- Series de gráficos con `NOD()` donde no hay dato (el gráfico deja el hueco); minigráficos de 12 meses; títulos de gráfico enlazados a celdas.

### 5. Controles
Ventas de octubre = ERP; Σ de delegaciones = total; pendiente = Marta; stock = Andrés; FTE = Lucía; ventas del P&L = ventas del ERP; presupuesto 9.480.000 € en las dos fuentes; agosto con 0 filas; octubre igual antes y después de cargar noviembre; noviembre = LEEME; casos de prueba que coinciden; 0 errores en el cuadro. Control maestro: `=Y(G4:G17)`, repetido en el encabezado del Cuadro.

### 6. Resultados de octubre de 2026 (los controles)
| Indicador | Resultado |
|---|---|
| Ventas netas de octubre | {es(C['ventas_oct'])} € |
| Ventas enero-octubre / presupuesto | {es(O['ventas_ytd'])} € / {es(O['ppto_ytd'], 0)} € = {es(V['cumpl_ventas_eneoct_pct'], 1)} % |
| Interanual enero-octubre: empresa / Lleida | +{es(V['var_total_eneoct_pct'], 1)} % / +{es(C['var_lleida_eneoct_pct'], 1)} % |
| Margen enero-octubre | {es(C['margen_eneoct_pct'], 1)} % (octubre solo: {es(O['margen_mes_pct'], 1)} %) |
| Cartera vencida > 60 a 31/10 | {es(O['vencido60'])} € / {es(O['pendiente'])} € = {es(C['vencida60_oct_pct'], 1)} % |
| PMC a 31/10 | {es(C['pmc_oct'], 1)} días |
| Stock a 31/10 y cobertura | {es(V['cuadre']['stock'])} € · {es(C['cobertura_oct'], 1)} días |
| FTE a 31/10 · absentismo enero-octubre | {es(O['fte'])} · {es(C['absentismo_eneoct_pct'], 1)} % |
| EBITDA enero-octubre: real / ppto | {es(O['ebitda_ytd_real'])} € / {es(O['ebitda_ytd_ppto'], 0)} € = {es(C['ebitda_cumpl_eneoct_pct'], 1)} % |

Si Lleida sale con más de un 100 %, falta «Lérida» en 2025. El PMC no es el de P3 (72 días): aquí las ventas salen del ERP con IVA, y Marta lo acepta si está en el diccionario.

### 7. Noviembre (prueba para el comité)
Ventas {es(N['ventas_mes'])} € ({es(cumpl_nov, 1)} % del presupuesto; {'+' if var_nov >= 0 else ''}{es(var_nov, 1)} % frente a noviembre de 2025), de ellas Logroño {es(V['ventas_nov_logrono'])} €; margen {es(N['margen_mes_pct'], 1)} %; vencida {es(N['vencida_pct'], 1)} %; PMC {es(N['pmc'], 1)} días; cobertura {es(N['cobertura'], 1)} días; FTE {es(N['fte'])}; EBITDA acumulado al {es(N['ebitda_cumpl_pct'], 1)} % del presupuesto. Octubre no cambia.

### 8. Accesibilidad, protección y entrega
Revisar > Comprobar accesibilidad (texto alternativo en los 4 gráficos, semáforo con símbolo y texto), Revisar > Proteger hoja en el Cuadro (solo los selectores desbloqueados), Inspeccionar documento, PDF A4 apaisado en una página, Manual y registro de cambios.

### 9. Cambio inesperado (enero de 2027)
Al cargar diciembre no se rompe nada si las consultas leen por nombre de columna y Logroño está en Alias. Para el 8.º indicador, la respuesta buena es negociar: sustituir uno que aporte menos o hacer una segunda página, y definir «cliente activo» (al menos una venta neta positiva en el mes; recuento distinto de CodCliente)."""

proyecto["solucion_md"] = SOL
with open(os.path.join(BASE, "proyectos", "p8.json"), "w", encoding="utf-8") as f:
    json.dump(proyecto, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("p8.json escrito;", len(SOL), "caracteres de solución; var nov", round(var_nov, 2), "cumpl nov", round(cumpl_nov, 2))
