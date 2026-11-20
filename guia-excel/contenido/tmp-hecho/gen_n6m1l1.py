import json, os
from decimal import Decimal, ROUND_HALF_UP
D = os.path.dirname(os.path.abspath(__file__))

def r2(x):
    return float(Decimal(str(x)).quantize(Decimal('0.01'), ROUND_HALF_UP))

# Listado de ventas de Lleida (los abonos vienen en positivo, con Tipo = Abono)
docs = [("L26-0405", "Factura", 2480.00), ("L26-0406", "Factura", 1150.50), ("R26-0029", "Abono", 210.00),
        ("L26-0407", "Factura", 3320.75), ("L26-0408", "Factura", 980.40), ("R26-0030", "Abono", 95.60)]
cel = {"A1": "Documento", "B1": "Tipo", "C1": "Base (€)", "D1": "Total con IVA (€)",
       "F1": "Cifra", "G1": "Importe", "F2": "Suma con IVA", "G2": "=SUMA(D2:D7)",
       "F3": "Suma sin IVA", "G3": "=SUMA(C2:C7)"}
for i, (n, t, b) in enumerate(docs, start=2):
    cel[f"A{i}"] = n; cel[f"B{i}"] = t; cel[f"C{i}"] = b; cel[f"D{i}"] = r2(b * 1.21)
fact = sum(b for _, t, b in docs if t == "Factura"); abo = sum(b for _, t, b in docs if t == "Abono")
neto = r2(fact - abo); con_iva = r2(sum(r2(b * 1.21) for *_, b in docs)); sin_iva = r2(fact + abo)
assert (neto, sin_iva, con_iva) == (7626.05, 8237.25, 9967.08), (neto, sin_iva, con_iva)
fmt = {"C2:D7": "eur", "G2:G4": "eur"}
anch = {"A": 11, "B": 9, "C": 11, "D": 15, "F": 24, "G": 12}
hoja_def = {"celdas": dict(cel), "formatos": fmt, "anchos": anch}
cel_ej = dict(cel); cel_ej["F4"] = "Ventas (definición de Carmen)"
hoja_ej = {"celdas": cel_ej, "formatos": fmt, "anchos": anch}

pert = {"A1": "Fase", "B1": "Optimista (h)", "C1": "Probable (h)", "D1": "Pesimista (h)", "E1": "Estimación (h)",
        "A7": "Total", "E7": "=SUMA(E2:E6)"}
fases = [("Conseguir los datos", 1, 2, 4), ("Revisar y limpiar", 2, 3, 8), ("Construir el informe", 3, 4, 6),
         ("Comprobar", 1, 1.5, 3), ("Presentar y documentar", 1, 1.5, 2)]
for i, (f, o, p, s) in enumerate(fases, start=2):
    pert[f"A{i}"] = f; pert[f"B{i}"] = o; pert[f"C{i}"] = p; pert[f"D{i}"] = s
tot = sum((o + 4 * p + s) / 6 for _, o, p, s in fases)
assert abs(tot - 79 / 6) < 1e-9

L = {
 "id": "n6m1l1",
 "titulo": "Entender el encargo: las preguntas que evitan rehacer el trabajo",
 "minutos": 15,
 "objetivo": "Convertir un encargo ambiguo en un plan claro: hacer las preguntas que importan, estimar el tiempo y confirmarlo todo por escrito en un correo breve.",
 "mision": {"de": "Carmen Soler", "puesto": "Directora general",
            "texto": "¿Cómo va la delegación de Lleida? Prepárame algo con los números para el comité de dirección del día 1. Gracias.",
            "logro": "Ya sabes convertir un encargo ambiguo en un plan: las preguntas clave, una estimación del tiempo con fundamento y la confirmación por escrito."},
 "funciones": [],
 "bloques": [
  {"tipo": "texto", "md": "Ya llevas tiempo en Electro Cierzo y empiezan a llegarte **proyectos enteros**. Lee otra vez el correo de Carmen y fíjate en lo que **no dice**: qué significa «ir bien», de qué periodo, «algo» con qué forma.\n\nSi abres Excel ahora, lo más probable es que hagas un informe impecable… de otra cosa. En este nivel no hay funciones nuevas: aprendes el **método** para que el trabajo salga bien a la primera."},
  {"tipo": "ejercicio", "id": "n6m1l1-e1", "modo": "test",
   "pregunta": "Acabas de leer el correo de Carmen. ¿Qué haces primero?",
   "opciones": [
    {"texto": "Apunto lo que no está claro y le hago unas pocas preguntas antes de empezar.", "correcta": True,
     "porque": "Eso es. Cinco minutos de preguntas te ahorran rehacer el informe. Carmen prefiere una pregunta hoy a una sorpresa el día del comité."},
    {"texto": "Abro Excel y saco las ventas de Lleida de este año, que será lo que quiere.", "correcta": False,
     "porque": "Es suponer en silencio. Quizá quiere compararla con Pamplona, o ver solo el último trimestre: si aciertas, es suerte."},
    {"texto": "Espero a que Carmen me mande más detalles.", "correcta": False,
     "porque": "No llegarán solos: para Carmen el encargo está claro. Aclararlo es parte de tu trabajo, y cuanto antes preguntes, más tiempo tendrás."},
    {"texto": "Preparo tres versiones distintas para que elija.", "correcta": False,
     "porque": "Triplicas el trabajo y quizá ninguna sea la buena. Una pregunta a tiempo sale mucho más barata."}],
   "explicacion": "Antes de construir, se entiende. Esa costumbre separa a quien sabe Excel de quien lleva proyectos."},
  {"tipo": "texto", "md": "De todas las preguntas, la primera es: **¿para quién es y qué decisión se va a tomar con esto?** La respuesta lo cambia todo.\n\nSi Carmen quiere decidir si contrata un segundo comercial en Lleida, necesita ver cómo evolucionan las ventas y compararlas con otra delegación. Si quiere decidir si cierra la delegación, necesitará también los gastos. Mismo correo, dos informes distintos.\n\nCuando sabes la decisión, sabes qué cifras sobran y cuáles faltan."},
  {"tipo": "tabla", "titulo": "Las preguntas que evitan rehacer el trabajo",
   "cabecera": ["Tema", "Qué preguntas", "Por qué importa"],
   "filas": [
    ["Decisión", "¿Para quién es? ¿Qué se va a decidir con esto?", "Marca qué cifras hacen falta y cuáles sobran."],
    ["Alcance", "¿Qué periodo? ¿Qué delegaciones? ¿Con qué detalle: por mes, por cliente, por comercial?", "Evita que el informe se quede corto o sea un muro de cifras."],
    ["Definiciones", "¿Con o sin IVA? ¿Por fecha de factura o de cobro? ¿Se restan los abonos (las facturas que restan por una devolución o un descuento)?", "La misma palabra puede dar cifras distintas."],
    ["Datos", "¿De dónde salen? ¿Quién responde por ellos? ¿Con qué cifra oficial deben cuadrar?", "Sabrás a quién preguntar cuando algo no cuadre."],
    ["Entrega", "¿Para cuándo? ¿En qué formato? ¿Se repetirá cada mes?", "Decide cuánto tiempo tienes y cómo montarlo."]],
   "pie": "No hace falta hacerlas todas siempre: pregunta lo que el encargo no deja claro."},
  {"tipo": "ejercicio", "id": "n6m1l1-e2", "modo": "test", "multiple": True,
   "pregunta": "Con el correo de Carmen delante, ¿qué preguntas tienes que hacerle sí o sí? Marca todas las necesarias.",
   "opciones": [
    {"texto": "¿Qué quieres decidir con este informe?", "correcta": True,
     "porque": "Imprescindible: de la decisión depende qué cifras le enseñas."},
    {"texto": "¿De qué periodo lo quieres y comparado con qué?", "correcta": True,
     "porque": "«Ir bien» siempre es comparado con algo: el año pasado, el presupuesto u otra delegación."},
    {"texto": "¿Las ventas, con o sin IVA? ¿Restando los abonos?", "correcta": True,
     "porque": "Son definiciones que cambian la cifra. El IVA no es dinero de la empresa (se ingresa a Hacienda), así que lo habitual es analizar sin IVA, pero se confirma."},
    {"texto": "¿Qué fórmulas prefieres que use?", "correcta": False,
     "porque": "Eso lo decides tú. A Carmen le importan las cifras y la conclusión, no la herramienta."},
    {"texto": "¿De qué color quieres los gráficos?", "correcta": False,
     "porque": "Es un detalle que puedes decidir tú, con los colores de la empresa. No gastes una pregunta en eso."}],
   "explicacion": "Pregunta por la decisión, el alcance y las definiciones. El cómo (fórmulas, colores, diseño) es tu terreno."},
  {"tipo": "texto", "md": "Las palabras de todos los días esconden trampas. «Ventas» puede ser con IVA o sin IVA, por fecha de factura o de cobro, restando los **abonos** (facturas que restan, por una devolución o un descuento) o sin restarlos.\n\nMira la hoja: es un listado de Lleida y ya salen dos cifras distintas. Si entregas una y Carmen esperaba otra, todo el informe queda en duda.\n\nPor eso cada cifra importante se **define antes** de calcularla."},
  {"tipo": "hoja", "titulo": "Un listado, dos «ventas»", "hoja": hoja_def, "resaltar": ["G2:G3"], "mostrar_formulas": True,
   "pie": "Y las dos sumas tratan los abonos como si fueran ventas. ¿Cuál es «la» cifra? Depende de la definición."},
  {"tipo": "ejercicio", "id": "n6m1l1-e3", "modo": "formula",
   "enunciado": "Carmen ha confirmado la definición: **ventas sin IVA, restando los abonos**. En este listado los abonos vienen en positivo y se distinguen por la columna **Tipo**. En **G4** calcula esas ventas: las facturas de la columna C menos los abonos de la columna C.",
   "hoja": hoja_ej, "objetivo": "G4",
   "solucion": '=SUMAR.SI(B2:B7;"Factura";C2:C7)-SUMAR.SI(B2:B7;"Abono";C2:C7)',
   "alternativas": ['=SUMAR.SI.CONJUNTO(C2:C7;B2:B7;"Factura")-SUMAR.SI.CONJUNTO(C2:C7;B2:B7;"Abono")',
                    '=SUMA(C2:C7)-2*SUMAR.SI(B2:B7;"Abono";C2:C7)'],
   "errores_tipicos": ["=SUMA(C2:C7)", '=SUMAR.SI(B2:B7;"Factura";C2:C7)',
                       '=SUMAR.SI(B2:B7;"Factura";D2:D7)-SUMAR.SI(B2:B7;"Abono";D2:D7)'],
   "variantes": [{"C4": 500}, {"B6": "Abono"}],
   "formato_resultado": "eur",
   "pistas": ["Necesitas dos sumas por categoría, las dos sobre la columna C (sin IVA): lo de tipo «Factura» y lo de tipo «Abono».",
              "SUMAR.SI(rango_del_criterio; criterio; rango_a_sumar) suma solo las filas que cumplen la condición. Haz una para «Factura» y réstale otra para «Abono».",
              '=SUMAR.SI(B2:B7;"Factura";C2:C7)-SUMAR.SI(B2:B7;"Abono";C2:C7)'],
   "explicacion": "7.626,05 €: la cifra con la definición acordada. Con los mismos datos tenías 9.967,08 € y 8.237,25 €. Tres «ventas» distintas: por eso las definiciones se pactan **antes** de calcular, y se escriben."},
  {"tipo": "texto", "md": "Pregunta también **de dónde salen los datos y quién responde por ellos**. ¿Del programa de gestión? ¿De una hoja que lleva un comercial? Quien responde por ellos te dirá si una cifra rara es un error o es real.\n\nY pregunta si hay una **cifra oficial con la que cuadrar**: el listado de ventas del programa o el cierre de Marta. Si tu total no coincide con esa cifra, nadie se fiará del resto del informe."},
  {"tipo": "aviso", "estilo": "cuidado", "titulo": "No prometas un plazo sin ver los datos",
   "md": "Nuria lo aprendió por las malas: «Prometí un informe *para mañana* y los datos venían con medio mes repetido. Ahora contesto: *te digo el plazo en cuanto vea los datos, hoy antes de las dos*». Mira primero cómo llegan; después, compromete la fecha."},
  {"tipo": "ejercicio", "id": "n6m1l1-e4", "modo": "abierta",
   "pregunta": "Escribe las preguntas que le mandarías a Carmen para aclarar su encargo («¿Cómo va la delegación de Lleida? Prepárame algo con los números para el comité de dirección del día 1»). Entre tres y cinco, cortas y concretas.",
   "modelo": "Hola, Carmen. Para prepararte lo de Lleida, ¿me confirmas cuatro cosas?\n1. ¿Qué quieres decidir en el comité con estos datos?\n2. ¿Qué periodo miramos y comparado con qué (el año pasado, el presupuesto, otras delegaciones)?\n3. ¿Ventas sin IVA y restando los abonos, por fecha de factura?\n4. ¿Lo quieres en una página en PDF o en el Excel? ¿Es para una vez o se repetirá?\nGracias.",
   "criterios": ["Pregunta por la decisión o el uso que se dará al informe",
                 "Pregunta por el periodo o con qué se compara",
                 "Aclara al menos una definición (IVA, abonos, tipo de fecha)",
                 "Pregunta por el formato, el plazo o si se repetirá",
                 "Son preguntas breves y concretas, fáciles de contestar"]},
  {"tipo": "mensaje", "de": "Carmen Soler", "puesto": "Directora general",
   "md": "Buenas preguntas. Es para decidir si contratamos un segundo comercial en Lleida. Quiero las ventas sin IVA y descontando abonos, de enero a octubre de 2026, comparadas con el mismo periodo de 2025 y con Pamplona. Una página en PDF para el comité del martes 1. Y si sale bien, lo querré cada mes."},
  {"tipo": "texto", "md": "Ahora sí puedes **estimar el tiempo**. Divide el trabajo en fases (conseguir los datos, revisarlos, construir, comprobar, presentar) y piensa tres cifras para cada una: **optimista** (todo sale bien), **probable** y **pesimista** (los datos llegan mal).\n\nUna técnica clásica de gestión de proyectos (PERT) las combina así:\n\n`(optimista + 4 × probable + pesimista) ÷ 6`\n\nEjemplo: 2, 3 y 8 horas → (2 + 12 + 8) ÷ 6 ≈ **3,7 horas**. El caso malo pesa, pero no manda."},
  {"tipo": "ejercicio", "id": "n6m1l1-e5", "modo": "formula",
   "enunciado": "En **E2** calcula la estimación de la fase «Conseguir los datos» con la fórmula de tres puntos: (optimista + 4 × probable + pesimista) ÷ 6. Tu fórmula se copiará hasta E6, y E7 ya suma el total. Cuidado con los paréntesis.",
   "hoja": {"celdas": pert, "formatos": {"B2:E7": "num2"}, "anchos": {"A": 22, "B": 13, "C": 12, "D": 13, "E": 14}},
   "objetivo": "E2", "copiar_a": ["E3:E6"],
   "solucion": "=(B2+4*C2+D2)/6",
   "alternativas": ["=(B2+C2*4+D2)/6", "=SUMA(B2;4*C2;D2)/6"],
   "errores_tipicos": ["=B2+4*C2+D2/6", "=(B2+C2+D2)/3", "=PROMEDIO(B2:D2)"],
   "variantes": [{"C2": 3, "D3": 10}],
   "formato_resultado": "num2",
   "pistas": ["Suma el optimista, cuatro veces el probable y el pesimista, y divide el resultado entre 6.",
              "Sin paréntesis, Excel divide primero: B2+4*C2+D2/6 solo divide el pesimista. Encierra la suma entre paréntesis.",
              "=(B2+4*C2+D2)/6"],
   "explicacion": "El total sale unas 13,2 horas: casi dos jornadas. Ya puedes dar un plazo con fundamento («borrador el jueves 26, versión final el lunes 30»), y si los datos llegan mal sabes qué fase se alarga."},
  {"tipo": "ejercicio", "id": "n6m1l1-e6", "modo": "ordenar",
   "enunciado": "Ordena cómo arrancas un encargo, desde que llega el correo hasta que empiezas a construir.",
   "pasos": ["Leer el encargo y apuntar lo que no está claro",
             "Preguntar a quien lo encarga: decisión, alcance, definiciones, datos y entrega",
             "Echar un primer vistazo a los datos",
             "Estimar el tiempo por fases",
             "Confirmar por escrito lo acordado y el plazo",
             "Empezar a construir"],
   "explicacion": "El plazo se promete después de ver los datos, y se construye después de confirmar. Así, si algo estaba mal entendido, se descubre cuando arreglarlo cuesta cinco minutos."},
  {"tipo": "texto", "md": "Cuando lo tengas claro, **confírmalo por escrito** en un correo breve:\n\n1. Lo que has entendido: la pregunta y la decisión.\n2. Las definiciones y los **supuestos**: lo que das por hecho sin que nadie te lo haya dicho.\n3. Qué entregas y cuándo.\n4. Qué necesitas de los demás.\n\nTermina pidiendo que te lo confirmen. Si algo estaba mal entendido, sale ahora y no el día del comité. Y queda constancia de lo acordado."},
  {"tipo": "aviso", "estilo": "dato", "titulo": "No es una manía tuya",
   "md": "El manual de calidad de los análisis del Gobierno británico (*AQuA Book*, edición de 2025) pide lo mismo: acordar al principio la pregunta, el plazo, las fuentes de datos y lo que se entrega, y dejarlo por escrito."},
  {"tipo": "ejercicio", "id": "n6m1l1-e7", "modo": "abierta",
   "pregunta": "**Misión:** escribe a Carmen el correo de confirmación con lo que te ha contestado: segundo comercial en Lleida; ventas sin IVA y descontando abonos; enero a octubre de 2026 frente a 2025 y frente a Pamplona; una página en PDF para el comité del martes 1 de diciembre. Has estimado unas 13 horas y aún te falta la exportación de datos que te tiene que pasar Marta. Máximo 8 líneas.",
   "modelo": "Asunto: Informe de Lleida para el comité del 1/12 · confirmación\n\nHola, Carmen:\nTe resumo lo acordado para que lo confirmes:\n- Objetivo: ayudarte a decidir si contratamos un segundo comercial en Lleida.\n- Cifras: ventas sin IVA y descontando abonos, por fecha de factura, de enero a octubre de 2026, comparadas con 2025 y con Pamplona.\n- Supuesto: la fuente es el listado de ventas del programa de gestión.\n- Entrega: una página en PDF. Borrador el jueves 26 y versión final el lunes 30, si Marta me pasa la exportación el lunes 23.\n¿Lo ves bien así? Gracias.",
   "criterios": ["Resume el objetivo: la decisión que se tomará",
                 "Recoge las definiciones y el periodo acordados",
                 "Deja claro al menos un supuesto o una dependencia (por ejemplo, los datos de Marta)",
                 "Da un plazo concreto, con borrador previo si procede",
                 "Es breve y termina pidiendo confirmación"]}
 ],
 "recuerda": [
  {"id": "n6m1l1-q1", "modo": "test",
   "pregunta": "Javier te escribe: «Pásame los clientes que más compran, para mañana». ¿Qué le preguntas primero?",
   "opciones": [
    {"texto": "¿Para qué lo vas a usar?", "correcta": True,
     "porque": "Si es para repartir visitas, quizá quiera los de cada zona; si es para revisar condiciones, el año completo. El uso decide el periodo, el detalle y la forma."},
    {"texto": "¿Lo hago con tabla dinámica o con fórmulas?", "correcta": False,
     "porque": "La herramienta es cosa tuya; a Javier le da igual cómo lo calcules."},
    {"texto": "¿Cuántas columnas quieres?", "correcta": False,
     "porque": "Es un detalle que se deduce cuando sabes para qué es."},
    {"texto": "Ninguna: saco los diez primeros del año y listo.", "correcta": False,
     "porque": "¿Diez o cincuenta? ¿Del año o del trimestre? ¿Con IVA? Suponer en silencio es lo que más trabajo hace repetir."}],
   "explicacion": "Primero, para qué y qué decisión. Lo demás se ordena solo."},
  {"id": "n6m1l1-q2", "modo": "predice",
   "enunciado": "Una fase tiene 2, 4 y 12 horas (optimista, probable y pesimista). ¿Qué estimación da esta fórmula?",
   "hoja": {"celdas": {"A1": "Optimista", "B1": "Probable", "C1": "Pesimista", "D1": "Estimación", "A2": 2, "B2": 4, "C2": 12},
            "anchos": {"A": 11, "B": 10, "C": 11, "D": 11}},
   "celda": "D2", "formula": "=(A2+4*B2+C2)/6",
   "explicacion": "(2 + 16 + 12) ÷ 6 = 30 ÷ 6 = 5 horas. El pesimista (12) tira hacia arriba, pero el probable pesa cuatro veces."},
  {"id": "n6m1l1-q3", "modo": "respuesta_corta",
   "pregunta": "¿Cómo se llama lo que das por hecho en un encargo sin que nadie te lo haya confirmado, y que debes escribir en el correo de confirmación? (Una palabra)",
   "aceptadas": ["supuesto", "supuestos", "los supuestos", "un supuesto"],
   "explicacion": "Los **supuestos** se escriben: si están mal, alguien te avisa a tiempo; si nadie los corrige, quedan aceptados."}
 ],
 "tarjetas": [
  {"tipo": "concepto", "frente": "¿Cuál es la primera pregunta ante cualquier encargo?", "dorso": "¿Para quién es y qué decisión se va a tomar con ello?"},
  {"tipo": "concepto", "frente": "Tres definiciones que cambian la cifra de «ventas»", "dorso": "Con o sin IVA; por fecha de factura, de pedido o de cobro; restando o no los abonos."},
  {"tipo": "concepto", "frente": "Estimación de tres puntos (PERT)", "dorso": "(optimista + 4 × probable + pesimista) ÷ 6, fase a fase."},
  {"tipo": "concepto", "frente": "¿Qué lleva el correo de confirmación de un encargo?", "dorso": "Lo entendido, definiciones y supuestos, qué entregas y cuándo, qué necesitas. Y pide que te lo confirmen."}
 ]
}
json.dump(L, open(os.path.join(D, "n6m1l1.json"), "w"), ensure_ascii=False, indent=1)
print("n6m1l1 ok")
