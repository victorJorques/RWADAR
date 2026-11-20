#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Construye proyectos/p4.json. Las respuestas de los controles salen de libros/src/p4-controles.json."""
import json
import os

EX = "/tmp/claude-0/-home-user-RWADAR/2f4f48c6-5daf-5e88-a4f7-bdceb91de476/scratchpad/excel"
C = json.load(open(os.path.join(EX, "libros/src/p4-controles.json"), encoding="utf-8"))
NV = C["noviembre"]


def es(x):
    s = f"{abs(x):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if x < 0 else "") + s


p = {
    "id": "p4",
    "titulo": "Conciliación bancaria mensual",
    "departamento": "Administración y finanzas",
    "nivel_requerido": "n4",
    "horas": 6,
    "resumen": "Explica por qué el banco y la contabilidad no dan lo mismo a 31 de octubre y deja la diferencia en 0,00 €: limpiar la descarga del banco, emparejar con nº de ocurrencia, remesas, partidas de septiembre, estado del auditor, asiento propuesto y una plantilla para cada mes.",
    "habilidades": ["Limpiar una descarga bancaria", "Debe y Haber a importe con signo", "Clave con nº de ocurrencia (CONTAR.SI.CONJUNTO)",
                    "BUSCARX con si_no_se_encuentra", "Emparejar con margen de fechas", "Remesas de muchos a uno (SUMAR.SI.CONJUNTO)",
                    "Partidas del mes anterior", "Estado de conciliación", "PAGO, PAGOINT y PAGOPRIN", "Asiento propuesto (PGC)",
                    "Formato condicional y validación de datos", "Plantilla .xltx y protección", "Power Query: Combinar consultas (alternativa)"],
    "correo": {
        "de": "Marta Ruiz (Directora financiera)", "para": "ti", "asunto": "Conciliación banco octubre",
        "cuerpo": "Hola:\n\nEl saldo del banco a 31 de octubre no me cuadra con el de contabilidad y en enero viene el auditor. ¿Me haces la conciliación de octubre? Y, ya puestos, déjala como plantilla para hacerla cada mes.\n\nTe paso el extracto que he descargado de la web del banco y el mayor de la cuenta (está todo en el mismo libro).\n\nMarta"
    },
    "preguntas_previas": {
        "pregunta": "Antes de abrir Excel: ¿qué le preguntarías a Marta? Escribe el correo con tus preguntas (de 4 a 7, concretas).",
        "modelo": "Hola, Marta:\n\nAntes de empezar, para que la conciliación salga como la necesita el auditor:\n1. La descarga trae dos hojas de movimientos. ¿Concilio solo la cuenta 572000001 del Banco Norte?\n2. ¿Septiembre quedó conciliado? ¿Quedó alguna partida pendiente que tenga que arrastrar a octubre?\n3. ¿Cuántos días de diferencia acepto entre la fecha del banco y la del apunte para dar por buena una pareja?\n4. Lo que el banco ha cargado y no está en contabilidad (comisiones, préstamo…), ¿lo contabilizo yo o te propongo el asiento? ¿Con qué fecha?\n5. ¿Se admite alguna diferencia final o tiene que quedar en 0,00 €?\n6. ¿Qué formato quiere el auditor?\n7. La plantilla, ¿quién la va a usar y con qué versión de Excel?\n\nGracias.",
        "criterios": ["Pregunta qué cuenta se concilia (hay dos hojas en la descarga)",
                      "Pregunta por las partidas pendientes del mes anterior",
                      "Pide un criterio objetivo para emparejar (margen de fechas)",
                      "Aclara quién contabiliza los ajustes y si se admite alguna diferencia",
                      "Pregunta el formato de salida o quién usará la plantilla"]
    },
    "aclaraciones": [
        {"pregunta": "¿Qué cuenta? La descarga trae dos hojas.", "respuesta": "La del Banco Norte, cuenta 572000001 (hoja «Movimientos»). La otra es la póliza de crédito del Banco Sur: no entra."},
        {"pregunta": "¿Septiembre quedó conciliado?", "respuesta": "Sí. Quedaron 2 partidas pendientes, que tienes en la hoja «Pendientes_septiembre». Cásalas antes que lo de octubre."},
        {"pregunta": "¿Qué margen de fechas acepto para dar por buena una pareja?", "respuesta": "±5 días naturales entre la fecha de operación del banco y la del apunte (el 5 incluido). Las pendientes de septiembre no tienen límite: un cheque se puede cobrar semanas después; esas casan por importe."},
        {"pregunta": "¿Contabilizo yo los ajustes?", "respuesta": "No: tú propones el asiento y Contabilidad lo registra con fecha 31/10, antes de cerrar octubre. Así, a noviembre solo pasan las partidas que están en libros y el banco aún no ha recogido."},
        {"pregunta": "¿Se tolera alguna diferencia?", "respuesta": "No: tiene que quedar en 0,00 €. Y nada de partidas «varios» para cuadrar."},
        {"pregunta": "¿Formato?", "respuesta": "El del auditor: saldo del banco → partidas → saldo ajustado; saldo de libros → partidas → saldo ajustado; los dos iguales. Debajo, la lista de partidas, una línea cada una."},
        {"pregunta": "La cuota del préstamo, ¿cómo la contabilizo?", "respuesta": "Sepárame intereses y capital. Las condiciones están en la hoja «Prestamo»."},
        {"pregunta": "¿Quién usará la plantilla?", "respuesta": "Tú cada mes, y yo cuando estés de vacaciones. Excel de Microsoft 365 en Windows."}
    ],
    "datos_md": "Todo está en **p4-datos.xlsx** (trabaja siempre sobre una copia):\n\n| Hoja | Qué es |\n|---|---|\n| Instrucciones | El encargo y cómo comprobarlo |\n| Movimientos y Movimientos (2) | Lo que Marta descargó de la banca online (servicio multibanco), tal cual |\n| Mayor_572000001 | El mayor de la cuenta 572000001 Banco Norte c/c que saca Contabilidad |\n| Pendientes_septiembre | Lo que quedó pendiente en la conciliación de septiembre |\n| Prestamo | Condiciones del préstamo que se carga en esta cuenta |\n\nSaldos de partida a 30/09/2026: banco **84.215,37 €** y libros **84.985,37 €** (la diferencia de 770,00 € la explican las dos pendientes de septiembre).\n\nLo que conviene vigilar (no está todo):\n- La descarga trae **filas de título** encima de la tabla y **algunas fechas no son fechas**.\n- Hay **importes que se repiten**: no des por hecho que son duplicados.\n- El mayor trae **Debe y Haber en dos columnas** y **filas que no son apuntes**.\n- El banco agrupa cosas que Contabilidad apunta una a una, y al revés.\n- Mucha información útil (nº de factura, de cheque, de remesa) va **dentro del concepto**.\n\nEl archivo **p4-noviembre.xlsx** es para el último paso: no lo abras antes.",
    "archivos": [
        {"archivo": "p4-datos.xlsx", "titulo": "Extracto, mayor y pendientes de septiembre", "descripcion": "Descarga del Banco Norte (y de otra cuenta), mayor de la 572000001, pendientes de septiembre y condiciones del préstamo."},
        {"archivo": "p4-noviembre.xlsx", "titulo": "Primera semana de noviembre (último paso)", "descripcion": "Banco y mayor del 01/11 al 06/11/2026 para el cambio inesperado. No lo abras hasta el paso 13."}
    ],
    "pasos": [
        {"titulo": "1. Aclarar el encargo y guardar los originales", "md": "Manda tus preguntas a Marta y apunta las respuestas en una hoja **Léame**. Guarda tu libro como `P4_Conciliacion_BancoNorte_2026-10_v01.xlsx` y copia lo recibido, sin tocarlo, en **Banco_origen** y **Libros_origen**.", "pista": "Mira las dos hojas de movimientos antes de preguntar: la línea «Entidad: … · Cuenta: …» de cada una te dice de qué cuenta es."},
        {"titulo": "2. Perfilar los datos", "md": "Antes de construir nada, anota en una hoja **Calidad_datos** qué problemas tiene cada hoja, cuántas filas afecta cada uno y qué decides hacer.", "pista": "Cuenta filas, mira qué celdas de fecha quedan alineadas a la izquierda (son texto), busca importes repetidos con CONTAR.SI y revisa la primera y la última fila del mayor."},
        {"titulo": "3. Parámetros", "md": "Crea la hoja **Parámetros** con la fecha de corte, los saldos inicial y final del banco y de libros, el margen de días y los datos del préstamo, cada uno con **nombre definido** y en celdas amarillas.", "pista": "Los saldos salen de los propios archivos: «Saldo inicial» de la descarga, saldo del último movimiento, «Saldo anterior» y «Sumas del periodo» del mayor. Nunca dentro de una fórmula."},
        {"titulo": "4. Preparar el banco", "md": "Pega la tabla del banco **sin las 6 filas de título** en una Tabla llamada **Banco** ([[Ctrl]]+[[T]]). Añade una columna **Fecha** que convierta también las fechas en texto y una columna que compruebe que cada saldo = saldo anterior + importe.", "pista": "`=SI(ESNUMERO([@FechaOperacion]);[@FechaOperacion];FECHANUMERO(ESPACIOS([@FechaOperacion])))`. Para el saldo: `=REDONDEAR(SI(ESNUMERO(E1);E1;SaldoIniBanco)+[@Importe]-[@Saldo];2)` tiene que dar 0 en todas las filas."},
        {"titulo": "5. Preparar los libros", "md": "Crea la Tabla **Libros** con una columna **Origen**: arriba las 2 pendientes de septiembre (Origen «Pendiente ant.») y debajo los apuntes del mayor (Origen «Libros»), sin las filas que no son apuntes. Calcula **Importe** = Debe − Haber.", "pista": "En la 572, el Debe es dinero que entra: así los cobros quedan en positivo y los pagos en negativo, igual que en el banco. `=REDONDEAR(N([@Debe])-N([@Haber]);2)`."},
        {"titulo": "6. Clave de emparejamiento", "md": "En las dos Tablas, una columna **Clave** = importe + nº de ocurrencia de ese importe (1.º, 2.º, 3.º…), con el rango que crece al bajar. Las líneas de remesa se quedan sin clave.", "pista": "`=[@Importe]&\"|\"&CONTAR.SI.CONJUNTO($D$2:D2;[@Importe])`. Así los cuatro cobros de 121,00 € son «121|1», «121|2», «121|3» y «121|4», y cada uno busca su pareja. Las pendientes van arriba para que se lleven el primer número."},
        {"titulo": "7. Buscar la pareja y comprobar la fecha", "md": "Con BUSCARX trae la fecha y el origen de la pareja del otro lado y calcula los días de diferencia. Columna **Estado**: «Casada», «Sin pareja» o «Fuera de margen».", "pista": "`=SI([@Clave]=\"\";\"\";BUSCARX([@Clave];Libros[Clave];Libros[Fecha];\"\"))`. El margen solo se aplica a los apuntes de octubre: las pendientes de septiembre casan aunque el cheque se cobrara 8 días después. «Hasta 5 días» incluye el 5 (`<=`)."},
        {"titulo": "8. Remesas: de muchos a uno", "md": "Saca la referencia de la remesa del concepto y comprueba que el abono del banco es igual a la suma de sus cobros en libros.", "pista": "`=SI.ERROR(EXTRAE([@Concepto];HALLAR(\"remesa R-\";[@Concepto])+7;6);\"\")` y después SUMAR.SI.CONJUNTO por esa referencia. Ojo: en el banco hay otra línea con «R-2610» que no es la remesa."},
        {"titulo": "9. Revisar lo que queda sin pareja", "md": "Clasifica cada partida sin pareja: en libros, **pago pendiente de cargo** o **ingreso en tránsito**; en el banco, **cargo** o **abono sin contabilizar**; y en los dos, **error en libros**. Una columna con la propuesta automática, otra para tu revisión (lista desplegable) y otra para la nota. Resalta con formato condicional las filas sin pareja.", "pista": "Lee los conceptos de lo que queda: ¿hay un cobro igual a otro ya casado, con el mismo concepto? ¿Hay un pago en cada lado con la misma factura y distinto importe? Esos no son partidas pendientes, son errores."},
        {"titulo": "10. Estado de conciliación y controles", "md": "Monta el estado del auditor con SUMAR.SI.CONJUNTO por tipo de partida y la lista de partidas, una línea cada una. En **Controles**: saldos que encadenan, cada fila casada o clasificada, parejas iguales en los dos lados, remesa cuadrada y diferencia 0,00, con un control maestro en verde.", "pista": "Cuadrar no basta: si pones una partida en el lado equivocado, los dos saldos ajustados siguen siendo iguales, pero dan otra cifra. Comprueba que cada partida pendiente tiene sentido (¿llegará en noviembre?)."},
        {"titulo": "11. Cuota del préstamo y asiento propuesto", "md": "Separa intereses y capital de la cuota cargada el 26/10 y prepara la propuesta de asiento con cuentas del PGC: los cargos del banco, la transferencia sin identificar y la corrección de los dos errores. Comprueba que Debe = Haber y que, aplicada, el saldo de libros es el saldo ajustado.", "pista": "Cuota nº `=SIFECHA(PrestPrimeraCuota;FechaCorte;\"M\")+1`; intereses `=REDONDEAR(PAGOINT(PrestTIN/12;CuotaMes;PrestCuotas;-PrestCapital);2)` y capital con PAGOPRIN. Cuentas: 626, 662, 520 (o 170), 430, 555, 400 y 572."},
        {"titulo": "12. Pendientes de octubre, plantilla y entrega", "md": "Hoja **Pendientes_octubre** con lo que pasa a noviembre. Guarda el libro como **Plantilla de Excel (*.xltx)** con un Léame de 8 pasos y protege las hojas de resultados. Exporta el estado y el asiento a PDF y escribe a Marta.", "pista": "Una Tabla no crece en una hoja protegida: protege Conciliación, Asiento y Controles, no Banco ni Libros. En el correo: la cifra, las 3 causas principales, el asiento y lo que propones cambiar."},
        {"titulo": "13. Cambio inesperado (noviembre)", "md": "Marta te escribe el 9/11:\n\n> Hola: te dejo en p4-noviembre.xlsx la primera semana de noviembre. El banco nos ha cobrado una comisión trimestral de 180,00 €. Y ya sabemos de quién era la transferencia de 1.089,00: de Telecomunicaciones Irati (C0112), que paga la factura F26-002214. ¿Me confirmas que lo de octubre ha llegado? Marta\n\nUsa tu plantilla **sin rehacer nada** (menos de 30 minutos): pendientes de octubre arriba, el banco y el mayor nuevos debajo, y propón la reclasificación de la 555.", "pista": "Contabilidad ya registró tu asiento a 31/10: el saldo anterior del mayor es tu saldo ajustado de octubre. Si las tres pendientes casan, la plantilla funciona. La transferencia identificada no toca la 572: Debe 555 / Haber 430 (C0112)."}
    ],
    "controles": [
        {"pregunta": "Saldo del Banco Norte a 31/10/2026, comprobado como saldo inicial + movimientos (€)", "respuesta": C["saldo_banco_31_10"], "tolerancia": 0.01, "pista": "Solo la hoja «Movimientos». Si te sale otra cifra, mira si has usado «Movimientos (2)» o si se te ha quedado una fila fuera al quitar el título."},
        {"pregunta": "Saldo de la cuenta 572000001 a 31/10/2026 según libros: saldo anterior + Debe − Haber de los apuntes (€)", "respuesta": C["saldo_libros_31_10"], "tolerancia": 0.01, "pista": "No sumes las filas «Saldo anterior» ni «Sumas del periodo»: si entran, el Debe y el Haber salen el doble."},
        {"pregunta": "Movimientos del banco que quedan sin pareja después de emparejar (nº)", "respuesta": C["banco_sin_pareja"], "tolerancia": 0, "pista": "Si te salen más, revisa que las pendientes de septiembre estén arriba de los libros, la remesa y la pareja que está justo a 5 días. Si te salen menos, has emparejado solo por importe."},
        {"pregunta": "Apuntes de libros de octubre que quedan sin pareja (nº)", "respuesta": C["libros_sin_pareja"], "tolerancia": 0, "pista": "Los 23 cobros de la remesa R-2610 no cuentan: casan por su total con un solo abono del banco."},
        {"pregunta": "Cargos del banco que faltan por contabilizar, en positivo (€)", "respuesta": C["cargos_banco_sin_contabilizar"], "tolerancia": 0.01, "pista": "Comisiones, cuota del préstamo, recibo devuelto y sus gastos. El cargo de 1.584,00 no va aquí: tiene pareja en libros con otro importe."},
        {"pregunta": "Saldo ajustado a 31/10/2026, el mismo en el lado del banco y en el de libros (€)", "respuesta": C["saldo_ajustado"], "tolerancia": 0.01, "pista": "Si tus dos saldos ajustados son iguales pero no dan esta cifra, alguna partida está en el lado equivocado: ¿un «ingreso en tránsito» que en realidad es un cobro contabilizado dos veces?"},
        {"pregunta": "Intereses de la cuota del préstamo cargada en octubre (€)", "respuesta": C["intereses_cuota_19"], "tolerancia": 0.01, "pista": "Es la cuota 19 de 48 (la primera fue el 25/04/2025): PAGOINT(5%/12;19;48;-85000), redondeado a céntimos."},
        {"pregunta": "Importe neto de las partidas que pasan a noviembre como pendientes (€, con signo)", "respuesta": C["pendientes_a_noviembre"], "tolerancia": 0.01, "pista": "Solo las de libros que el banco aún no ha recogido: dos pagos y un cobro. Los cargos del banco y los errores se arreglan con el asiento de octubre."}
    ],
    "entregables": [
        "Libro P4_Conciliacion_BancoNorte_2026-10_v01.xlsx con Léame, Parámetros, Banco_origen, Libros_origen, Tablas Banco y Libros, Conciliación, Asiento, Pendientes_octubre, Calidad_datos y Controles con el control maestro en verde.",
        "Plantilla P4_Conciliacion_BancoNorte.xltx lista para noviembre, con las hojas de resultados protegidas.",
        "PDF de una página con el estado de conciliación y la lista de partidas, y otro con la propuesta de asiento.",
        "Correo de entrega a Marta (máximo 15 líneas).",
        "Tras el cambio de noviembre: la conciliación del 01-06/11 hecha con la plantilla, la reclasificación de la 555 y el registro de cambios al día."
    ],
    "rubrica": [
        {"criterio": "Exactitud", "niveles": [
            "En desarrollo: la diferencia no es 0,00 y no se explica, o se ha usado la otra cuenta.",
            "Aceptable: 0,00, pero forzado con una partida «varios» o con alguna partida en el lado equivocado.",
            "Bien: 0,00 con las 16 partidas identificadas y bien clasificadas; saldo ajustado de 54.854,69 €.",
            "Excelente: además, detecta el cobro duplicado y la transposición, separa intereses y capital y documenta en Calidad_datos los problemas sembrados con su impacto en €."]},
        {"criterio": "Estructura", "niveles": [
            "En desarrollo: punteo a mano con colores sobre la descarga.",
            "Aceptable: hojas separadas, pero emparejando a ojo o con los saldos escritos dentro de las fórmulas.",
            "Bien: Tablas Banco y Libros, clave con nº de ocurrencia, estado con fórmulas y parámetros con nombre.",
            "Excelente: además, pendientes que se arrastran, asiento propuesto con cuentas del PGC y un Léame con el que otra persona la hace sola."]},
        {"criterio": "Automatización y mantenimiento", "niveles": [
            "En desarrollo: el mes que viene hay que rehacerla.",
            "Aceptable: se reutiliza copiando hojas y retocando fórmulas.",
            "Bien: plantilla .xltx: se pegan banco y mayor y sale el estado; noviembre se resuelve en menos de 30 minutos.",
            "Excelente: además, los controles avisan solos (saldos que no encadenan, fechas fuera del mes, remesas descuadradas) o Power Query lee la descarga tal cual."]},
        {"criterio": "Presentación", "niveles": [
            "En desarrollo: listados sin estado de conciliación.",
            "Aceptable: estado sin el formato del auditor o sin formatos de número.",
            "Bien: estado del auditor en una página, legible, con € y fechas bien formateados.",
            "Excelente: además, partidas agrupadas y explicadas en una línea cada una, controles visibles arriba y sin depender solo del color."]},
        {"criterio": "Comunicación", "niveles": [
            "En desarrollo: «Ya cuadra».",
            "Aceptable: lista de partidas sin explicar ni proponer nada.",
            "Bien: correo con el saldo ajustado, las 3 causas principales y el asiento propuesto.",
            "Excelente: además, propone mejoras de proceso (cobros con referencia, contabilizar comisiones y cuota cada mes, revisar duplicados al importar) y avisa del recibo devuelto que hay que reclamar."]}
    ],
    "correo_entrega": {
        "pregunta": "Escribe el correo con el que entregas la conciliación a Marta (máximo 15 líneas).",
        "modelo": "Asunto: Conciliación Banco Norte octubre 2026: diferencia 0,00 €\n\nHola, Marta:\n\nTe dejo la conciliación de octubre (libro y PDF) y la plantilla para cada mes. Banco (61.482,19 €) y libros (61.924,13 €) quedan en el mismo saldo ajustado: 54.854,69 €.\n\nLas causas principales:\n1. Lo que el banco aún no ha recogido: el cheque 1203 (4.812,50) y la transferencia a Cables Arnedo (7.260,00), y un cobro de Electro Olite (5.445,00) que llega en noviembre.\n2. Cargos del banco sin contabilizar (4.492,44): cuota del préstamo (229,56 de intereses y 1.727,93 de capital), recibo devuelto de C0087 (2.420,00, hay que reclamarlo) y 114,95 de comisiones. Además, una transferencia de 1.089,00 sin identificar.\n3. Dos errores en libros: el cobro de Reformas Aznar está dos veces (asientos 2026/3871 y 3872) y el pago a Elecvía se contabilizó por 1.548,00 en vez de 1.584,00.\n\nEn la hoja Asiento tienes la propuesta con fecha 31/10. Propongo pedir a los clientes que pongan el nº de factura en las transferencias y contabilizar comisiones y cuota cada mes.\n\nUn saludo.",
        "criterios": ["Da el saldo ajustado y confirma la diferencia de 0,00 €",
                      "Explica las causas agrupadas, con cifras",
                      "Señala los dos errores de contabilidad y el recibo que hay que reclamar",
                      "Remite a la propuesta de asiento sin contabilizar nada",
                      "Propone al menos una mejora del proceso; las cifras coinciden con las del libro"]
    },
    "solucion_md": "",
    "archivo_solucion": "p4-solucion.xlsx",
    "errores_tipicos": [
        "Usar la hoja «Movimientos (2)», que es la póliza del Banco Sur.",
        "Emparejar solo por importe: los cuatro cobros de 121,00, los tres pagos de 605,00 y los cinco recibos de 48,40 se cruzan entre sí.",
        "No poner arriba las pendientes de septiembre: el cheque 1187 (−2.350,00 del 06/10) busca pareja en el pago de −2.350,00 del 27/10 y sale «Fuera de margen», y ese pago del 27/10 se queda sin pareja.",
        "Sumar las filas «Saldo anterior» y «Sumas del periodo» del mayor junto con los apuntes.",
        "Signo invertido: Debe y Haber al revés respecto al cargo y abono del banco.",
        "Casar la remesa línea a línea, o buscar «R-2610» en el banco y sumar también la devolución del recibo.",
        "Poner el cobro duplicado como «ingreso en tránsito»: cuadra igual, pero el saldo ajustado sale 3.630,00 más alto y en noviembre ese cobro no llegará nunca.",
        "Cuadrar con una partida «varios» o escribir el saldo inicial a mano dentro de una fórmula.",
        "Confundir la fecha valor con la fecha de operación (la cuota «del 25» se carga el lunes 26).",
        "Abrir el libro en un Excel con Windows en inglés: FECHANUMERO lee «01/10/2026» como 10 de enero. El control de fechas dentro del mes lo detecta."
    ],
    "ampliaciones": [
        "Power Query: leer la descarga tal cual (Quitar filas superiores, configuración regional), numerar las ocurrencias con Agrupar por y Combinar consultas «Externa completa» y «Anti izquierda».",
        "Pedir al banco el extracto en Norma 43 (.txt de ancho fijo) y leerlo con Power Query dividiendo por posiciones; usar el concepto común para clasificar solo comisiones y devoluciones.",
        "Cuadro de amortización completo del préstamo con PAGO, PAGOINT y PAGOPRIN y el control Σ capital = 85.000,00 (ya está en la hoja Préstamo de la solución: rehazlo sin mirar).",
        "Fecha robusta que no depende de la configuración de Windows: =FECHA(DERECHA(ESPACIOS(A2);4);EXTRAE(ESPACIOS(A2);4;2);IZQUIERDA(ESPACIOS(A2);2)).",
        "Un control que avise si el saldo inicial del mes no coincide con el saldo final de la conciliación anterior."
    ]
}

p["solucion_md"] = f"""### La idea
Dos Tablas, **Banco** y **Libros**, con lo recibido pegado tal cual y columnas que calculan solas la fecha limpia, el importe con signo, la clave y la pareja. Lo que queda sin pareja se clasifica, y el estado de conciliación, el asiento y los controles salen de las Tablas con SUMAR.SI.CONJUNTO. El libro resuelto (`p4-solucion.xlsx`) tiene todo hecho con fórmulas, el cuadro del préstamo y la hoja **Cómo se hizo** con la alternativa en Power Query.

### 1. Lo que había en los datos (hoja Calidad_datos)
| Problema | Dónde | Qué se hizo |
|---|---|---|
| 6 filas de título antes de la tabla | Movimientos | Se pega solo la tabla; el saldo inicial (84.215,37) va a Parámetros |
| Otra cuenta en la descarga | Movimientos (2) | No entra: es la póliza del Banco Sur |
| {C['fechas_texto']} fechas de operación en texto ({C['fechas_texto_con_espacio']} con un espacio al final) | Movimientos, columna A | `=SI(ESNUMERO([@FechaOperacion]);[@FechaOperacion];FECHANUMERO(ESPACIOS([@FechaOperacion])))` |
| Importes repetidos legítimos: 121,00 ×4, −605,00 ×3, −48,40 ×5, −12,40 ×2, −2.350,00 ×2 | Banco y mayor | No se quitan: clave con nº de ocurrencia |
| Debe y Haber en dos columnas | Mayor | Importe = Debe − Haber (en la 572, el Debe es entrada) |
| «Saldo anterior» y «Sumas del periodo» entre los apuntes | Mayor | No se pegan; sus saldos van a Parámetros |
| Nº de factura, cheque y remesa dentro del concepto | Los dos lados | Se usan para revisar la remesa y los errores |

### 2. Banco y libros
- Tabla **Banco** (185 movimientos). Comprobación fila a fila: `=REDONDEAR(SI(ESNUMERO(E1);E1;SaldoIniBanco)+[@Importe]-[@Saldo];2)` da 0 en todas. 84.215,37 − 22.733,18 = **61.482,19**.
- Tabla **Libros**: 2 pendientes de septiembre arriba (Origen «Pendiente ant.») y 199 apuntes (Origen «Libros»). `=REDONDEAR(N([@Debe])-N([@Haber]);2)`. 84.985,37 − 23.061,24 = **61.924,13**.

### 3. Clave, pareja y estado
- Remesa: `=SI.ERROR(EXTRAE([@Concepto];HALLAR("remesa R-";[@Concepto])+7;6);"")`.
- Clave: `=SI([@Remesa]<>"";"";[@Importe]&"|"&CONTAR.SI.CONJUNTO($D$2:D2;[@Importe];$I$2:I2;""))` (en Libros, con sus columnas H y J).
- Pareja: `=SI([@Clave]="";"";BUSCARX([@Clave];Libros[Clave];Libros[Fecha];""))` y lo mismo con Libros[Origen]; Días = Fecha − FechaLibros.
- Estado: `=SI([@Remesa]<>"";SI(ABS(SUMAR.SI.CONJUNTO(Libros[Importe];Libros[Remesa];[@Remesa])-[@Importe])<0,005;"Casada (remesa)";"Remesa descuadrada");SI([@FechaLibros]="";"Sin pareja";SI(O([@OrigenPareja]<>"Libros";ABS([@Dias])<=MargenDias);"Casada";"Fuera de margen")))`.
- Resultado: **{C['parejas_uno_a_uno']} parejas** uno a uno en cada lado (171 de octubre + las 2 de septiembre), la remesa R-2610 (18.430,20 = 23 cobros) casada, y sin pareja **{C['banco_sin_pareja']} movimientos del banco** y **{C['libros_sin_pareja']} apuntes de libros**. Una pareja está justo a 5 días (banco 02/10, libros 07/10): con `<5` en lugar de `<=` saldrían dos más.

### 4. Lo que queda sin pareja
Columna **TipoPropuesto** automática (`=SI(IZQUIERDA([@Estado];6)="Casada";"";SI([@Importe]<0;"Cargo banco sin contabilizar";"Abono banco sin contabilizar"))`), columna **Revision** con lista desplegable para corregirla y **Tipo** final = `=SI([@Revision]<>"";[@Revision];[@TipoPropuesto])`.

| Partida | Lado | Importe | Tipo |
|---|---|---|---|
| Cheque nº 1203 (29/10) | Libros | −4.812,50 | Pago pendiente de cargo |
| Transferencia fra. A-26/3305 Cables Arnedo (30/10) | Libros | −7.260,00 | Pago pendiente de cargo |
| Cobro F26-002168 Electro Olite (31/10) | Libros | 5.445,00 | Ingreso en tránsito |
| Comisión de mantenimiento (31/10) | Banco | −45,00 | Cargo sin contabilizar (626) |
| 5 comisiones de transferencia | Banco | −63,90 | Cargo sin contabilizar (626) |
| Cuota 19/48 del préstamo (operación 26/10, valor 25/10) | Banco | −1.957,49 | Cargo sin contabilizar (662 y 520) |
| Devolución del recibo F26-002086 de C0087 (iba en la remesa) | Banco | −2.420,00 | Cargo sin contabilizar (430) |
| Gastos de la devolución | Banco | −6,05 | Cargo sin contabilizar (626) |
| Transferencia sin identificar (31/10) | Banco | 1.089,00 | Abono sin contabilizar (555) |
| Cobro F26-002087 Reformas Aznar, asiento 2026/3872 | Libros | 3.630,00 | **Error: duplicado** (la propuesta decía «ingreso en tránsito») |
| Pago fra. EV-26-08841 Elecvía: banco −1.584,00 / libros −1.548,00 | Los dos | −36,00 | **Error: importe** (transposición) |

### 5. Estado de conciliación a 31/10/2026
| Lado banco | € | Lado libros | € |
|---|---|---|---|
| Saldo según el banco | 61.482,19 | Saldo según libros | 61.924,13 |
| + Ingresos en tránsito | 5.445,00 | − Cargos del banco sin contabilizar | −4.492,44 |
| − Pagos pendientes de cargo | −12.072,50 | + Abonos del banco sin contabilizar | 1.089,00 |
| | | − Cobro contabilizado dos veces | −3.630,00 |
| | | − Pago contabilizado con otro importe | −36,00 |
| **Saldo bancario ajustado** | **54.854,69** | **Saldo contable ajustado** | **54.854,69** |

Diferencia **0,00**. Fórmulas: `=SaldoIniBanco+SUMA(Banco[Importe])`, `=SUMAR.SI.CONJUNTO(Libros[Importe];Libros[Tipo];"Ingreso en tránsito")` y, para los errores, lo del banco menos lo de libros: `=SUMAR.SI.CONJUNTO(Banco[Importe];Banco[Tipo];"Error en libros: importe")-SUMAR.SI.CONJUNTO(Libros[Importe];Libros[Tipo];"Error en libros: importe")`. Debajo, la lista de partidas sale sola con FILTRAR, APILARH y APILARV (en Excel 2019 o anterior, filtrando cada Tabla por Tipo).

**Cuidado:** si el cobro duplicado se deja como «ingreso en tránsito», los dos lados siguen cuadrando, pero en 58.484,69 €. Por eso el control importante no es «diferencia 0», sino que cada partida esté donde debe.

### 6. Préstamo y asiento propuesto (fecha 31/10/2026)
Cuota nº `=SIFECHA(PrestPrimeraCuota;FechaCorte;"M")+1` = 19. Intereses `=REDONDEAR(PAGOINT(PrestTIN/12;CuotaMes;PrestCuotas;-PrestCapital);2)` = **229,56**; capital con PAGOPRIN = **1.727,93**; cuota con PAGO = 1.957,49, igual que el cargo del banco.

| Asiento | Debe | Haber |
|---|---|---|
| 1 | 626 Servicios bancarios 114,95 · 662 Intereses de deudas 229,56 · 520 Deudas a c/p con entidades de crédito 1.727,93 · 430 Clientes 2.420,00 | 572 Banco Norte 4.492,44 |
| 2 | 572 Banco Norte 1.089,00 | 555 Partidas pendientes de aplicación 1.089,00 |
| 3 | 430 Clientes 3.630,00 (o anular el asiento 2026/3872) | 572 Banco Norte 3.630,00 |
| 4 | 400 Proveedores 36,00 | 572 Banco Norte 36,00 |

Efecto en la 572: −7.069,44. Saldo de libros después: 61.924,13 − 7.069,44 = **54.854,69**, el saldo ajustado. (El capital va a la 520 si la parte a corto plazo está reclasificada; si no, a la 170.)

### 7. Pendientes, plantilla y controles
- **Pendientes_octubre** = las 3 partidas de libros (neto **{es(C['pendientes_a_noviembre'])} €**), con FILTRAR sobre Libros[Tipo]. Se copian como valores arriba de la Tabla Libros de noviembre.
- **Controles** (16, control maestro `=Y(G6:G21)` en verde y repetido arriba de Conciliación): saldos que encadenan, fechas dentro del mes, casadas + clasificadas = total en cada lado, mismas parejas en los dos lados, remesa cuadrada, nada «Fuera de margen», diferencia 0, cuota = cargo, intereses + capital = cargo, Debe = Haber y saldo de libros tras el asiento = saldo ajustado.
- **Plantilla**: Archivo > Guardar como > «Plantilla de Excel (*.xltx)», con las Tablas vaciadas y Conciliación, Asiento y Controles protegidas (Revisar > Proteger hoja). Banco y Libros sin proteger, porque una Tabla no crece en una hoja protegida.

### 8. El cambio de noviembre
1. En Parámetros: corte 06/11/2026, banco {es(61482.19)} → {es(NV['saldo_banco'])}, libros {es(54854.69)} → {es(NV['saldo_libros'])} (el saldo anterior ya es el ajustado de octubre porque se registró el asiento).
2. Libros: las 3 pendientes de octubre arriba y los {NV['apuntes_libros']} apuntes del mayor; Banco: los {NV['movimientos_banco']} movimientos. Las 3 pendientes casan (el cheque 1203 se cobró el 04/11, 6 días después: sin límite por ser del mes anterior).
3. Sin pareja: la comisión trimestral (−180,00, cargo sin contabilizar, 626) y el pago fra. MR-26-1290 (−3.146,00, pendiente de cargo). Saldo ajustado: **{es(NV['ajustado'])}** en los dos lados.
4. Reclasificación (no toca la 572): Debe 555 Partidas pendientes de aplicación 1.089,00 / Haber 430 Clientes (C0112, F26-002214) 1.089,00. Anotar en el registro de cambios del Léame.

### 9. Lo que hay que contar a Marta
- La diferencia de 441,94 € (61.924,13 − 61.482,19) no es un error único: son 16 líneas sin pareja (3 de tiempo, 10 cargos y abonos del banco y 3 de dos errores de contabilidad).
- Hay que reclamar a C0087 el recibo devuelto (2.420,00) y averiguar la transferencia de 1.089,00.
- Mejoras: pedir a los clientes el nº de factura en las transferencias, contabilizar cada mes las comisiones y la cuota (con su cuadro de amortización) y revisar duplicados al importar cobros."""

json.dump(p, open(os.path.join(EX, "proyectos/p4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("ok", len(json.dumps(p, ensure_ascii=False)))
